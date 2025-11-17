import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Prüfe ob BLOB Token vorhanden ist
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN nicht konfiguriert");
      return NextResponse.json(
        { error: "Upload-Service nicht konfiguriert" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const listingId = formData.get("listingId") as string;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    // Validiere Dateityp
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Nur Bilddateien sind erlaubt" },
        { status: 400 }
      );
    }

    // Validiere Dateigröße (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Datei ist zu groß (max. 10MB)" },
        { status: 400 }
      );
    }

    // Prüfe ob Listing existiert und User berechtigt ist
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Wohnmobil nicht gefunden" },
          { status: 404 }
        );
      }

      if (session.user.role !== "ADMIN" && listing.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
      }
    }

    // Upload zu Vercel Blob
    // Verwende einen eindeutigen Dateinamen basierend auf Timestamp
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const uniqueFileName = `uploads/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const blob = await put(uniqueFileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Speichere Bild-URL in Datenbank falls listingId vorhanden
    if (listingId) {
      await prisma.image.create({
        data: {
          listingId,
          url: blob.url,
          alt: file.name,
        },
      });
    }

    return NextResponse.json({
      url: blob.url,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Fehler beim Hochladen: ${errorMessage}` },
      { status: 500 }
    );
  }
}

