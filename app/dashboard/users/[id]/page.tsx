import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/users/user-form";

export const dynamic = "force-dynamic";

export default async function EditUserPage(props: any) {
  await requireAdmin();
  const params =
    props?.params && typeof props.params?.then === "function"
      ? await props.params
      : props?.params;
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id || typeof id !== "string") {
    redirect("/dashboard/users");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, editorProfile: true, profileImage: true },
  });
  if (!user) {
    redirect("/dashboard/users");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Benutzer bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Passen Sie Daten oder Rolle des Benutzers an.
        </p>
      </div>
      <UserForm mode="edit" user={user} />
    </div>
  );
}

