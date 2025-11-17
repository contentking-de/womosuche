import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "LANDLORD", "EDITOR"]).default("LANDLORD"),
  password: z.string().min(6),
  editorProfile: z.object({
    biographie: z.string().optional(),
    schwerpunkt: z.string().optional(),
    referenzen: z.string().optional(),
  }).optional(),
  profileImage: z.string().url().optional().nullable().or(z.literal("")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        editorProfile: data.editorProfile || null,
        profileImage: data.profileImage || null,
        updatedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
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

