import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireLandlord() {
  return requireRole("LANDLORD");
}

export async function requireEditor() {
  return requireRole("EDITOR");
}

export async function requireAdminOrEditor() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    redirect("/dashboard");
  }
  return user;
}

