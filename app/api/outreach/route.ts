import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

// Import Prisma Client directly to avoid caching issues
let prismaInstance: any = null;

function getPrismaClient() {
  if (!prismaInstance) {
    // Clear require cache first
    try {
      const prismaClientPath = require.resolve("@prisma/client");
      delete require.cache[prismaClientPath];
      Object.keys(require.cache).forEach(key => {
        if (key.includes("@prisma/client") || key.includes(".prisma")) {
          delete require.cache[key];
        }
      });
    } catch (e) {
      // Ignore cache clearing errors
    }
    
    // Create fresh Prisma Client instance
    const { PrismaClient } = require("@prisma/client");
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    // Verify it has the outreachPlace model
    if (typeof prismaInstance.outreachPlace === 'undefined') {
      throw new Error("Prisma Client missing outreachPlace model. Please run 'npx prisma generate' and restart the server.");
    }
    
    console.log("Prisma Client initialized with outreachPlace model");
  }
  return prismaInstance;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    // Nur ADMINs können die Liste abrufen
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    // Get Prisma Client (will create new instance if needed)
    const prisma = getPrismaClient();

    const { searchParams } = new URL(request.url);
    const contacted = searchParams.get("contacted");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    const where: any = {};

    if (contacted === "true") {
      where.contacted = true;
    } else if (contacted === "false") {
      where.contacted = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.outreachPlace.count({ where });

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);

    const places = await prisma.outreachPlace.findMany({
      where,
      orderBy: [
        { contacted: "asc" },
        { name: "asc" },
      ],
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      places,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Outreach GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

const createPlaceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail").nullable().optional().or(z.literal("")),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  googlePlaceId: z.string().nullable().optional(),
  googleCID: z.string().nullable().optional(),
  googleFID: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
  reviews: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  keyword: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  timing: z.any().nullable().optional(),
  url: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  listingUrl: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
  reviewsLink: z.string().url("Ungültige URL").nullable().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createPlaceSchema.parse(body);

    const prisma = getPrismaClient();

    // Erstelle neuen Datensatz
    const created = await prisma.outreachPlace.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website || null,
        email: data.email || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        googlePlaceId: data.googlePlaceId ?? null,
        googleCID: data.googleCID ?? null,
        googleFID: data.googleFID ?? null,
        rating: data.rating ?? null,
        reviews: data.reviews ?? null,
        status: data.status ?? null,
        category: data.category ?? null,
        keyword: data.keyword ?? null,
        priceRange: data.priceRange ?? null,
        timing: data.timing ?? null,
        url: data.url || null,
        listingUrl: data.listingUrl || null,
        reviewsLink: data.reviewsLink || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Outreach POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

