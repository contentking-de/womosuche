import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listings/listing-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Lade User-Liste für Admin
  const availableUsers =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "LANDLORD" },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wohnmobil bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Bearbeiten Sie die Details Ihres Wohnmobils
        </p>
      </div>
      <ListingForm
        listing={listing}
        userRole={user.role}
        availableUsers={availableUsers}
      />
    </div>
  );
}

