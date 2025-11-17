import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  if (!params?.token) {
    redirect("/forgot-password");
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Passwort zurücksetzen</h1>
          <p className="mt-2 text-muted-foreground">
            Geben Sie Ihr neues Passwort ein
          </p>
        </div>
        <ResetPasswordForm token={params.token} />
      </div>
    </div>
  );
}

