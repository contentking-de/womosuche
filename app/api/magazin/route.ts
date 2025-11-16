import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const articleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = articleSchema.parse(body);

    // Prüfe ob Slug bereits existiert
    const existing = await prisma.article.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ein Artikel mit diesem Slug existiert bereits" },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: validatedData,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create article error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

