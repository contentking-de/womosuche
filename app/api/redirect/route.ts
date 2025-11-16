import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromPath = searchParams.get("path");
  if (!fromPath) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  try {
    const redirect = await prisma.redirect.findUnique({
      where: { fromPath },
    });

    if (!redirect) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({ found: true, toPath: redirect.toPath });
  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}



