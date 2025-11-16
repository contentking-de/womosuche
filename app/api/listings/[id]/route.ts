import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
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
});

export async function PUT(
  request: Request,
  { params }: any
) {
  try {
    const idParam = params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
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

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...validatedData,
        slug,
      },
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.errors },
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
  { params }: any
) {
  try {
    const idParam = params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
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

