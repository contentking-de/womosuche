"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Inquiry } from "@prisma/client";

interface UpdateInquiryStatusButtonProps {
  inquiry: Inquiry;
}

export function UpdateInquiryStatusButton({ inquiry }: UpdateInquiryStatusButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === inquiry.status) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren");
      }

      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      alert("Fehler beim Aktualisieren des Status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select
      value={inquiry.status}
      onValueChange={handleStatusChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="OPEN">Offen</SelectItem>
        <SelectItem value="ANSWERED">Beantwortet</SelectItem>
        <SelectItem value="ARCHIVED">Archiviert</SelectItem>
      </SelectContent>
    </Select>
  );
}

