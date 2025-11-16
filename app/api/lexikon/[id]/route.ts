import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const termSchema = z.object({
  term: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().min(10),
});

export async function PUT(request: Request, context: any) {
  try {
    const ctx = context && typeof context?.then === "function" ? await context : context;
    const idParam = ctx?.params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const term = await prisma.glossaryTerm.findUnique({
      where: { id },
    });

    if (!term) {
      return NextResponse.json({ error: "Begriff nicht gefunden" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedData = termSchema.parse(body);

    // Prüfe ob Slug bereits existiert (außer für aktuellen Begriff)
    if (validatedData.slug !== term.slug) {
      const existing = await prisma.glossaryTerm.findUnique({
        where: { slug: validatedData.slug },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Ein Begriff mit diesem Slug existiert bereits" },
          { status: 400 }
        );
      }
    }

    const updatedTerm = await prisma.glossaryTerm.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedTerm);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update term error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const ctx = context && typeof context?.then === "function" ? await context : context;
    const idParam = ctx?.params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const term = await prisma.glossaryTerm.findUnique({
      where: { id },
    });

    if (!term) {
      return NextResponse.json({ error: "Begriff nicht gefunden" }, { status: 404 });
    }

    await prisma.glossaryTerm.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Begriff gelöscht" });
  } catch (error) {
    console.error("Delete term error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

