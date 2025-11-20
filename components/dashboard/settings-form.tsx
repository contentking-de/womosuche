"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const schema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(6, "Mindestens 6 Zeichen").optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
  editorBiographie: z.string().optional(),
  editorSchwerpunkt: z.string().optional(),
  editorReferenzen: z.string().optional(),
  profileImage: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  street: z.string().min(3, "Straße und Hausnummer ist erforderlich").optional().or(z.literal("")),
  city: z.string().min(2, "Stadt ist erforderlich").optional().or(z.literal("")),
  postalCode: z.string().min(4, "Postleitzahl ist erforderlich").optional().or(z.literal("")),
  country: z.string().min(2, "Land ist erforderlich").optional().or(z.literal("")),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

interface SettingsFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: "ADMIN" | "LANDLORD" | "EDITOR";
    editorProfile?: { biographie?: string; schwerpunkt?: string; referenzen?: string } | null;
    profileImage?: string | null;
    street?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.profileImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      password: "",
      confirmPassword: "",
      editorBiographie: (user?.editorProfile && typeof user.editorProfile === 'object' && 'biographie' in user.editorProfile) 
        ? String(user.editorProfile.biographie || "") 
        : "",
      editorSchwerpunkt: (user?.editorProfile && typeof user.editorProfile === 'object' && 'schwerpunkt' in user.editorProfile) 
        ? String(user.editorProfile.schwerpunkt || "") 
        : "",
      editorReferenzen: (user?.editorProfile && typeof user.editorProfile === 'object' && 'referenzen' in user.editorProfile) 
        ? String(user.editorProfile.referenzen || "") 
        : "",
      profileImage: user?.profileImage || "",
      street: user?.street ?? "",
      city: user?.city ?? "",
      postalCode: user?.postalCode ?? "",
      country: user?.country ?? "DE",
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload fehlgeschlagen");
      }

      const data = await response.json();
      setProfileImageUrl(data.url);
      setValue("profileImage", data.url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: uploadingImage,
  });

  const removeImage = () => {
    setProfileImageUrl(null);
    setValue("profileImage", "");
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = {
        name: data.name || null,
        email: data.email,
        street: data.street || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
      };
      
      // Profilbild nur senden, wenn es gesetzt wurde
      if (data.profileImage !== undefined) {
        payload.profileImage = data.profileImage || null;
      }

      // Nur Passwort senden, wenn es eingegeben wurde
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }

      // Editor-Profil nur für EDITORs
      if (user.role === "EDITOR") {
        payload.editorProfile = {
          biographie: data.editorBiographie || null,
          schwerpunkt: data.editorSchwerpunkt || null,
          referenzen: data.editorReferenzen || null,
        };
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Profil-Einstellungen</CardTitle>
          <CardDescription>
            Aktualisiere deine persönlichen Informationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
              Einstellungen erfolgreich gespeichert!
            </div>
          )}

          {/* Profilbild */}
          <div className="space-y-2">
            <Label>Profilbild</Label>
            {profileImageUrl ? (
              <div className="relative inline-block">
                <Image
                  src={profileImageUrl}
                  alt="Profilbild"
                  width={100}
                  height={100}
                  className="rounded-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                  disabled={submitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                } ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                {uploadingImage ? (
                  <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Klicken oder ziehen, um ein Bild hochzuladen
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF bis zu 10MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Name und E-Mail */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Vor- und Nachname"
                {...register("name")}
                disabled={submitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@domain.tld"
                {...register("email")}
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Passwort ändern */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Passwort ändern</h3>
              <p className="text-sm text-muted-foreground">
                Lasse die Felder leer, wenn du dein Passwort nicht ändern möchtest.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={submitting}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={submitting}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Editor-Profil (nur für EDITORs) */}
          {user.role === "EDITOR" && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Editor-Profil</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Informationen werden in deinen Artikeln angezeigt.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editorBiographie">Biographie</Label>
                  <Textarea
                    id="editorBiographie"
                    placeholder="Erzähle etwas über dich..."
                    rows={4}
                    {...register("editorBiographie")}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editorSchwerpunkt">Schwerpunkt</Label>
                  <Input
                    id="editorSchwerpunkt"
                    placeholder="z.B. Camping, Reisen, Technik"
                    {...register("editorSchwerpunkt")}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editorReferenzen">Referenzen</Label>
                  <Textarea
                    id="editorReferenzen"
                    placeholder="Deine bisherigen Veröffentlichungen oder Erfahrungen..."
                    rows={3}
                    {...register("editorReferenzen")}
                    disabled={submitting}
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Rechnungsadresse */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Rechnungsadresse</h3>
              <p className="text-sm text-muted-foreground">
                Diese Adresse wird für die Steuerberechnung verwendet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input
                id="street"
                type="text"
                placeholder="Musterstraße 123"
                {...register("street")}
                disabled={submitting}
              />
              {errors.street && (
                <p className="text-sm text-destructive">{errors.street.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postleitzahl</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="12345"
                  {...register("postalCode")}
                  disabled={submitting}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Berlin"
                  {...register("city")}
                  disabled={submitting}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                type="text"
                placeholder="DE"
                {...register("country", { value: "DE" })}
                disabled={submitting}
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

