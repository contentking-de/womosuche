"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SubscriberForm } from "./subscriber-form";
import { DeleteSubscriberButton } from "./delete-subscriber-button";

interface NewsletterActionsProps {
  subscriber: {
    id: string;
    email: string;
    name: string | null;
    lists: ("NEWS" | "REISEBERICHTE" | "VERMIETUNGEN")[];
    confirmed: boolean;
  };
}

export function NewsletterActions({ subscriber }: NewsletterActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <DeleteSubscriberButton subscriberId={subscriber.id} email={subscriber.email} />
      </div>
      <SubscriberForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        subscriber={subscriber}
      />
    </>
  );
}

