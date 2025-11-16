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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const p = params && typeof (params as any)?.then === "function" ? await (params as Promise<{ id: string }>) : (params as { id: string });
    const idParam = p?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = articleSchema.parse(body);

    // Prüfe ob Slug bereits existiert (außer für aktuellen Artikel)
    if (validatedData.slug !== article.slug) {
      const existing = await prisma.article.findUnique({
        where: { slug: validatedData.slug },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Ein Artikel mit diesem Slug existiert bereits" },
          { status: 400 }
        );
      }
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update article error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const p = params && typeof (params as any)?.then === "function" ? await (params as Promise<{ id: string }>) : (params as { id: string });
    const idParam = p?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Artikel gelöscht" });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

