"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function MobileInquiryButton() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const inquirySection = document.getElementById("inquiry-form");
      if (inquirySection) {
        const rect = inquirySection.getBoundingClientRect();
        // Verstecke Button, wenn Formular im Viewport sichtbar ist (mit etwas Puffer)
        const isFormVisible = rect.top < window.innerHeight - 100;
        setIsVisible(!isFormVisible);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToInquiry = () => {
    const inquirySection = document.getElementById("inquiry-form");
    if (inquirySection) {
      inquirySection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 shadow-lg md:hidden transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Button
        onClick={scrollToInquiry}
        className="w-full"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Zur Buchungsanfrage
      </Button>
    </div>
  );
}

