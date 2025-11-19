import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAuth();

  // Lade vollständige Benutzerdaten
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      editorProfile: true,
      profileImage: true,
    },
  });

  if (!userData) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalte deine Kontoeinstellungen und Profildaten.
        </p>
      </div>
      <SettingsForm user={userData} />
    </div>
  );
}

