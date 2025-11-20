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
      // 404 ist hier normal - bedeutet einfach "kein Redirect vorhanden"
      // Verwende 200 statt 404, um Logs zu reduzieren
      return NextResponse.json({ found: false }, { status: 200 });
    }

    return NextResponse.json({ found: true, toPath: redirect.toPath });
  } catch (err) {
    console.error("Redirect lookup error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}



