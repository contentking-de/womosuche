import { requireAuth } from "@/lib/auth-helpers";
import { OutreachPageClient } from "@/components/dashboard/outreach-page-client";

export default async function OutreachPage() {
  const user = await requireAuth();

  // Nur ADMINs können auf diese Seite zugreifen
  if (user.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-3xl font-bold">Zugriff verweigert</h1>
        <p className="mt-2 text-muted-foreground">
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Outreach</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Wohnmobilvermietungen und kontaktieren Sie diese.
        </p>
      </div>
      <OutreachPageClient />
    </div>
  );
}

