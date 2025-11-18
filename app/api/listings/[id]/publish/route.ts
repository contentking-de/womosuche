import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Nur Admins können Wohnmobile freigeben
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nur Administratoren können Wohnmobile freigeben" },
        { status: 403 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Wohnmobil nicht gefunden" },
        { status: 404 }
      );
    }

    // Setze published auf true
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        published: true,
      },
    });

    return NextResponse.json({
      message: "Wohnmobil erfolgreich freigegeben",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Publish listing error:", error);
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
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Nur Admins können Wohnmobile zurückziehen
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nur Administratoren können Wohnmobile zurückziehen" },
        { status: 403 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Wohnmobil nicht gefunden" },
        { status: 404 }
      );
    }

    // Setze published auf false
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        published: false,
      },
    });

    return NextResponse.json({
      message: "Wohnmobil erfolgreich zurückgezogen",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Unpublish listing error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

