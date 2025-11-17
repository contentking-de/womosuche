import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { geocodeLocation } from "@/lib/geocode";
import { z } from "zod";

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerDay: z.number().min(1),
  seats: z.number().min(1),
  beds: z.number().min(1),
  location: z.string().min(2),
  features: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  ownerId: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Wohnmobil nicht gefunden" }, { status: 404 });
    }

    // Prüfe Berechtigung
    if (session.user.role !== "ADMIN" && listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = listingSchema.parse(body);

    // Generiere neuen Slug falls Titel geändert wurde
    let slug = listing.slug;
    if (validatedData.title !== listing.title) {
      slug = await generateUniqueSlug(
        validatedData.title,
        async (newSlug) => {
          const existing = await prisma.listing.findUnique({
            where: { slug: newSlug },
          });
          return !existing || existing.id === listing.id;
        }
      );
    }

    // Geocode Location nur wenn sie sich geändert hat
    let coordinates: { lat: number | null; lng: number | null } | undefined;
    if (validatedData.location !== listing.location) {
      const coords = await geocodeLocation(validatedData.location).catch(
        () => null
      );
      coordinates = {
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };
    }

    // Erlaube ownerId-Änderung nur für Admins
    const updateData: any = {
      ...validatedData,
      slug,
      ...(coordinates && { lat: coordinates.lat, lng: coordinates.lng }),
    };

    // Nur Admins können ownerId ändern
    if (session.user.role === "ADMIN" && validatedData.ownerId) {
      // Prüfe ob User existiert
      const owner = await prisma.user.findUnique({
        where: { id: validatedData.ownerId },
      });
      if (!owner) {
        return NextResponse.json(
          { error: "Vermieter nicht gefunden" },
          { status: 400 }
        );
      }
      updateData.ownerId = validatedData.ownerId;
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update listing error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Wohnmobil nicht gefunden" }, { status: 404 });
    }

    // Prüfe Berechtigung
    if (session.user.role !== "ADMIN" && listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Wohnmobil gelöscht" });
  } catch (error) {
    console.error("Delete listing error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

