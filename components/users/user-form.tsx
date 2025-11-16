"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail"),
  role: z.enum(["ADMIN", "LANDLORD"]),
  password: z.string().min(6, "Mindestens 6 Zeichen").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: { id: string; name: string | null; email: string; role: "ADMIN" | "LANDLORD" };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "LANDLORD",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload: any = {
        email: values.email,
        role: values.role,
      };
      if (values.name) payload.name = values.name;
      if (values.password) payload.password = values.password;

      const res = await fetch(mode === "create" ? "/api/users" : `/api/users/${user?.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Fehler beim Speichern");
      }
      router.push("/dashboard/users");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Vor- und Nachname" {...register("name")} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" placeholder="name@domain.tld" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Rolle</Label>
            <Select
              defaultValue={watch("role")}
              onValueChange={(v) => setValue("role", v as "ADMIN" | "LANDLORD")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LANDLORD">LANDLORD</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{mode === "create" ? "Passwort" : "Passwort (optional, zum Ändern)"}</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Speichere..." : mode === "create" ? "Benutzer anlegen" : "Speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

