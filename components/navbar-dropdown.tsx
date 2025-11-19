"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, ChevronDown, Euro, FileText, HelpCircle, Info, MessageSquare, MapPin } from "lucide-react";

export function NavbarDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold hover:text-primary transition-colors"
              onClick={(e) => {
                // Erlaube Navigation, aber verhindere dass das Dropdown schließt
                e.stopPropagation();
              }}
            >
              <Home className="h-4 w-4" />
              Wohnmobile mieten
            </Link>
            <span className="flex items-center text-base font-bold hover:text-primary transition-colors ml-1">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-56" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <DropdownMenuItem asChild>
            <Link href="/#pricing" className="flex items-center">
              <Euro className="mr-2 h-4 w-4" />
              Preise für Vermieter
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/#magazin" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Aktuelle Artikel
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/#faq" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQ
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/#about" className="flex items-center">
              <Info className="mr-2 h-4 w-4" />
              Über uns
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/#testimonials" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Nutzer Feedback
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/wohnmobil-abstellplaetze" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Wohnmobil Abstellplätze
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

