import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/listings/listing-form";

export default async function NewListingPage() {
  const user = await requireAuth();

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
        <h1 className="text-3xl font-bold">Neues Wohnmobil anlegen</h1>
        <p className="mt-2 text-muted-foreground">
          Fügen Sie ein neues Wohnmobil zu Ihrem Inventar hinzu
        </p>
      </div>
      <ListingForm
        userRole={user.role}
        ownerId={user.id}
        availableUsers={availableUsers}
      />
    </div>
  );
}

