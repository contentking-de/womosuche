import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listings/listing-form";

export default async function EditListingPage({ params }: any) {
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const user = await requireAuth();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
    },
  });

  if (!listing) {
    notFound();
  }

  // Prüfe Berechtigung
  if (user.role !== "ADMIN" && listing.ownerId !== user.id) {
    redirect("/dashboard/listings");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wohnmobil bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Bearbeiten Sie die Details Ihres Wohnmobils
        </p>
      </div>
      <ListingForm listing={listing} />
    </div>
  );
}

