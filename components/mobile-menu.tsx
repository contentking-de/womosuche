"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Home, Car, BookOpen, FileText, User, LogOut, LogIn, UserPlus } from "lucide-react";
import type { User as UserType } from "next-auth";
import { signOutAction } from "@/lib/actions";

interface MobileMenuProps {
  user: UserType | null;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menü öffnen</span>
          </Button>
        </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <Home className="h-5 w-5" />
              Wohnmobile mieten
            </Link>
            <Link
              href="/wohnmobile"
              className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <Car className="h-5 w-5" />
              Wohnmobile Übersicht
            </Link>
            <Link
              href="/magazin"
              className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <FileText className="h-5 w-5" />
              Camping Magazin
            </Link>
            <Link
              href="/lexikon"
              className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="h-5 w-5" />
              Wohnmobil Lexikon
            </Link>
          </div>

          <div className="border-t pt-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Dashboard
                </Link>
                <div className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    {user.name && (
                      <p className="text-sm font-medium">{user.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Abmelden
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-3 px-3 py-2 text-base font-semibold hover:bg-accent rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <UserPlus className="h-5 w-5" />
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </nav>
      </SheetContent>
      </Sheet>
    </div>
  );
}

