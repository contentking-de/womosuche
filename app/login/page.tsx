import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/auth/login-form";

interface SearchParams {
  callbackUrl?: string;
  passwordReset?: string;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const callbackUrl =
    typeof params?.callbackUrl === "string"
      ? params.callbackUrl
      : undefined;
  const passwordReset = params?.passwordReset === "true";
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
        <LoginForm callbackUrl={callbackUrl} passwordReset={passwordReset} />
      </div>
    </div>
  );
}

