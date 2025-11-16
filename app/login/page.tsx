import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: any) {
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string"
      ? searchParams.callbackUrl
      : undefined;
  const user = await getCurrentUser();
  if (user) {
    redirect(callbackUrl || "/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Anmelden</h1>
          <p className="mt-2 text-muted-foreground">
            Melden Sie sich in Ihrem Konto an
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}

