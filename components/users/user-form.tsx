"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const schema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").optional().or(z.literal("")),
  email: z.string().email("Ungültige E-Mail"),
  role: z.enum(["ADMIN", "LANDLORD", "EDITOR"]),
  password: z.string().min(6, "Mindestens 6 Zeichen").optional().or(z.literal("")),
  editorBiographie: z.string().optional(),
  editorSchwerpunkt: z.string().optional(),
  editorReferenzen: z.string().optional(),
  profileImage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: { 
    id: string; 
    name: string | null; 
    email: string; 
    role: "ADMIN" | "LANDLORD" | "EDITOR";
    editorProfile?: { biographie?: string; schwerpunkt?: string; referenzen?: string } | null;
    profileImage?: string | null;
  };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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
      role: user?.role ?? "LANDLORD",
      password: "",
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
    },
  });

  const selectedRole = watch("role");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploadingImage(true);
    
    try {
      // Erstelle einen eindeutigen Dateinamen für Profilbilder
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const uniqueFileName = `profile-${timestamp}.${fileExtension}`;
      
      // Erstelle eine neue File-Instanz mit dem neuen Namen
      const renamedFile = new File([file], uniqueFileName, { type: file.type });
      
      const formData = new FormData();
      formData.append("file", renamedFile);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unbekannter Fehler" }));
        throw new Error(errorData.error || `Upload fehlgeschlagen: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.url) {
        throw new Error("Keine URL vom Server erhalten");
      }
      
      setProfileImageUrl(result.url);
      setValue("profileImage", result.url);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Fehler beim Hochladen";
      alert(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const removeProfileImage = () => {
    setProfileImageUrl(null);
    setValue("profileImage", "");
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload: any = {
        email: values.email,
        role: values.role,
      };
      if (values.name) payload.name = values.name;
      if (values.password) payload.password = values.password;
      
      // Editor-Profil nur für EDITOR-Rolle
      if (values.role === "EDITOR") {
        payload.editorProfile = {
          biographie: values.editorBiographie || "",
          schwerpunkt: values.editorSchwerpunkt || "",
          referenzen: values.editorReferenzen || "",
        };
        payload.profileImage = values.profileImage || null;
      } else {
        // Profilbild löschen, wenn Rolle nicht EDITOR ist
        payload.profileImage = null;
      }

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
              onValueChange={(v) => setValue("role", v as "ADMIN" | "LANDLORD" | "EDITOR")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rolle wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LANDLORD">LANDLORD</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="EDITOR">EDITOR</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{mode === "create" ? "Passwort" : "Passwort (optional, zum Ändern)"}</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {selectedRole === "EDITOR" && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Editor-Profil</h3>
              </div>

              <div className="grid gap-2">
                <Label>Profilbild</Label>
                {profileImageUrl ? (
                  <div className="relative inline-block">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-muted">
                      <Image
                        src={profileImageUrl}
                        alt="Profilbild"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                      onClick={removeProfileImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    {uploadingImage ? (
                      <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                    ) : isDragActive ? (
                      <p className="text-sm text-muted-foreground">Datei hier ablegen...</p>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Klicken Sie zum Auswählen oder ziehen Sie ein Bild hierher
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, WEBP bis zu 5MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editorBiographie">Biographie</Label>
                <Textarea
                  id="editorBiographie"
                  placeholder="Kurze Biographie des Editors..."
                  rows={4}
                  {...register("editorBiographie")}
                />
                {errors.editorBiographie && <p className="text-sm text-red-600">{errors.editorBiographie.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editorSchwerpunkt">Schwerpunkt</Label>
                <Textarea
                  id="editorSchwerpunkt"
                  placeholder="Thematische Schwerpunkte..."
                  rows={3}
                  {...register("editorSchwerpunkt")}
                />
                {errors.editorSchwerpunkt && <p className="text-sm text-red-600">{errors.editorSchwerpunkt.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editorReferenzen">Referenzen</Label>
                <Textarea
                  id="editorReferenzen"
                  placeholder="Wichtige Referenzen und Veröffentlichungen..."
                  rows={4}
                  {...register("editorReferenzen")}
                />
                {errors.editorReferenzen && <p className="text-sm text-red-600">{errors.editorReferenzen.message}</p>}
              </div>
            </>
          )}

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

