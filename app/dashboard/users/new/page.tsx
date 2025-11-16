import { requireAdmin } from "@/lib/auth-helpers";
import { UserForm } from "@/components/users/user-form";

export default async function NewUserPage() {
  await requireAdmin();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Benutzer anlegen</h1>
        <p className="mt-2 text-muted-foreground">
          Legen Sie einen neuen Benutzer an.
        </p>
      </div>
      <UserForm mode="create" />
    </div>
  );
}

