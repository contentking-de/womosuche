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
  categories: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  editorId: z.string().optional().nullable(),
  featuredImageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
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

    // Stelle sicher, dass editorId und featuredImageUrl explizit gesetzt werden
    // Wenn editorId im Body vorhanden ist (auch wenn null), verwende es, sonst lasse es undefined
    const updateData: any = {
      title: validatedData.title,
      slug: validatedData.slug,
      excerpt: validatedData.excerpt,
      content: validatedData.content,
      tags: validatedData.tags,
      categories: validatedData.categories,
      published: validatedData.published,
    };
    
    // editorId explizit setzen, auch wenn es null ist
    if ('editorId' in body) {
      updateData.editorId = body.editorId || null;
    }
    
    // featuredImageUrl explizit setzen, auch wenn es null ist
    if ('featuredImageUrl' in body) {
      updateData.featuredImageUrl = body.featuredImageUrl || null;
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
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

