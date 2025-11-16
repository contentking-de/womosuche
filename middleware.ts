import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Versuche Legacy-Redirect (alte WordPress-URLs) frühzeitig aufzulösen
  // Nur wenn keine API-Route und kein Next intern
  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon.ico")
  ) {
    // Pfad vereinheitlichen (ohne trailing slash)
    const normalized =
      pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const url = new URL(`/api/redirect?path=${encodeURIComponent(normalized)}`, req.url);
    // Edge Middleware unterstützt fetch – die API ist server-side und kann Prisma nutzen
    return fetch(url)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.found && typeof data.toPath === "string") {
            return NextResponse.redirect(new URL(data.toPath, req.url));
          }
        }
        // kein Redirect – weiter mit normalem Flow
        return continueAuthFlow();
      })
      .catch(() => {
        // Bei Fehlern normal fortfahren
        return continueAuthFlow();
      });
  }

  function continueAuthFlow() {
  // Öffentliche Routen
  const publicRoutes = [
    "/",
    "/wohnmobile",
    "/lexikon",
    "/magazin",
    "/login",
    "/register",
  ];

  // Prüfe ob Route öffentlich ist
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Wenn öffentliche Route, erlaube Zugriff
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Dashboard-Routen erfordern Login
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only Routen
    const adminRoutes = [
      "/dashboard/lexikon",
      "/dashboard/magazin",
      "/dashboard/users",
    ];
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
  runtime: 'edge', // Edge Runtime für bessere Performance
};

