import { requireAuth } from "@/lib/auth-helpers";
import { ListingForm } from "@/components/listings/listing-form";

export default async function NewListingPage() {
  await requireAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neues Wohnmobil anlegen</h1>
        <p className="mt-2 text-muted-foreground">
          Fügen Sie ein neues Wohnmobil zu Ihrem Inventar hinzu
        </p>
      </div>
      <ListingForm />
    </div>
  );
}

