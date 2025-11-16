import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Registrieren</h1>
          <p className="mt-2 text-muted-foreground">
            Erstellen Sie ein neues Konto als Vermieter
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

