import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  request: Request,
  context: { params: { [key: string]: string | string[] } }
) {
  try {
    const idParam = context.params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Bild nicht gefunden" }, { status: 404 });
    }

    // Prüfe Berechtigung
    if (
      session.user.role !== "ADMIN" &&
      image.listing.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    // Lösche aus Vercel Blob
    try {
      await del(image.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobError) {
      console.error("Blob delete error:", blobError);
      // Weiter mit DB-Löschung auch wenn Blob-Löschung fehlschlägt
    }

    // Lösche aus Datenbank
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bild gelöscht" });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

