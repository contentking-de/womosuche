import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

// Import Prisma Client directly to avoid caching issues
let prismaInstance: any = null;

function getPrismaClient() {
  if (!prismaInstance) {
    try {
      const prismaClientPath = require.resolve("@prisma/client");
      delete require.cache[prismaClientPath];
      Object.keys(require.cache).forEach(key => {
        if (key.includes("@prisma/client") || key.includes(".prisma")) {
          delete require.cache[key];
        }
      });
    } catch (e) {
      // Ignore cache clearing errors
    }
    
    const { PrismaClient } = require("@prisma/client");
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    if (typeof prismaInstance.outreachPlace === 'undefined') {
      throw new Error("Prisma Client missing outreachPlace model. Please run 'npx prisma generate' and restart the server.");
    }
  }
  return prismaInstance;
}

const updatePlaceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail").nullable().optional().or(z.literal("")),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  googlePlaceId: z.string().nullable().optional(),
  googleCID: z.string().nullable().optional(),
  googleFID: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
  reviews: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  keyword: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  timing: z.any().nullable().optional(),
  url: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  listingUrl: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  reviewsLink: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  contacted: z.boolean().optional(),
  contactNotes: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePlaceSchema.parse(body);

    const prisma = getPrismaClient();

    // Prüfe ob Datensatz existiert
    const existing = await prisma.outreachPlace.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vermietung nicht gefunden" },
        { status: 404 }
      );
    }

    // Aktualisiere Datensatz
    const updated = await prisma.outreachPlace.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website || null,
        email: data.email || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        googlePlaceId: data.googlePlaceId ?? null,
        googleCID: data.googleCID ?? null,
        googleFID: data.googleFID ?? null,
        rating: data.rating ?? null,
        reviews: data.reviews ?? null,
        status: data.status ?? null,
        category: data.category ?? null,
        keyword: data.keyword ?? null,
        priceRange: data.priceRange ?? null,
        timing: data.timing ?? null,
        url: data.url || null,
        listingUrl: data.listingUrl || null,
        reviewsLink: data.reviewsLink || null,
        contacted: data.contacted ?? existing.contacted,
        contactNotes: data.contactNotes ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Outreach PUT error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const prisma = getPrismaClient();

    // Prüfe ob Datensatz existiert
    const existing = await prisma.outreachPlace.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vermietung nicht gefunden" },
        { status: 404 }
      );
    }

    // Lösche Datensatz
    await prisma.outreachPlace.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Vermietung erfolgreich gelöscht" });
  } catch (error) {
    console.error("Outreach DELETE error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

