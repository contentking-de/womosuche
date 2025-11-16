import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const termSchema = z.object({
  term: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = termSchema.parse(body);

    // Prüfe ob Slug bereits existiert
    const existing = await prisma.glossaryTerm.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ein Begriff mit diesem Slug existiert bereits" },
        { status: 400 }
      );
    }

    const term = await prisma.glossaryTerm.create({
      data: validatedData,
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create term error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

