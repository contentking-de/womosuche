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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = listingSchema.parse(body);

    // Generiere eindeutigen Slug
    const slug = await generateUniqueSlug(
      validatedData.title,
      async (slug) => {
        const existing = await prisma.listing.findUnique({
          where: { slug },
        });
        return !existing;
      }
    );

    const listing = await prisma.listing.create({
      data: {
        ...validatedData,
        slug,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

