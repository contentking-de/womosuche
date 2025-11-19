import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "LANDLORD", "EDITOR"]).optional(),
  password: z.string().min(6).optional(),
  editorProfile: z.object({
    biographie: z.string().optional(),
    schwerpunkt: z.string().optional(),
    referenzen: z.string().optional(),
  }).optional().nullable(),
  profileImage: z.string().url().optional().nullable().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, editorProfile: true, profileImage: true, createdAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    
    // Benutzer können nur ihr eigenes Profil bearbeiten, außer sie sind ADMIN
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 });
      }
    }

    // Prüfe aktuelle Rolle, um zu sehen ob sich die Rolle ändert
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    const updateData: any = {};
    
    // Nur ADMINs können die Rolle ändern
    if (data.role && session.user.role === "ADMIN") {
      updateData.role = data.role;
    }
    
    // Name und E-Mail können von allen geändert werden
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    // Editor-Profil nur setzen, wenn es explizit übergeben wird
    if (data.editorProfile !== undefined) {
      updateData.editorProfile = data.editorProfile;
    }
    
    // Profilbild setzen, wenn es übergeben wird
    if (data.profileImage !== undefined) {
      updateData.profileImage = data.profileImage;
    }
    
    // Wenn Rolle von EDITOR zu etwas anderem geändert wird, Editor-Profil und Profilbild löschen (nur für ADMINs)
    if (currentUser?.role === "EDITOR" && data.role && data.role !== "EDITOR" && session.user.role === "ADMIN") {
      updateData.editorProfile = null;
      updateData.profileImage = null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, editorProfile: true, profileImage: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Benutzer gelöscht" });
}

