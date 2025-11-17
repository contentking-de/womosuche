"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SubscriberForm } from "./subscriber-form";

export function NewsletterCreateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Neuer Subscriber
      </Button>
      <SubscriberForm isOpen={isOpen} onClose={() => setIsOpen(false)} subscriber={null} />
    </>
  );
}

