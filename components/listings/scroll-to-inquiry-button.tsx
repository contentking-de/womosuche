"use client";

import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export function ScrollToInquiryButton() {
  const handleScroll = () => {
    const element = document.getElementById("inquiry-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Button
      onClick={handleScroll}
      className="w-full mt-4"
      size="lg"
    >
      Jetzt Buchungsanfrage stellen
      <ArrowDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

