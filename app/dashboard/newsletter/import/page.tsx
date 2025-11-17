import { requireAdmin } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewsletterImportForm } from "@/components/newsletter/newsletter-import-form";

export default async function NewsletterImportPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/newsletter">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Newsletter-Verwaltung
        </Button>
      </Link>

      <NewsletterImportForm />
    </div>
  );
}

