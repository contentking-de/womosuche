import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/auth";
import { Home, User, LogOut, Settings, LogIn, UserPlus } from "lucide-react";
import Image from "next/image";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="block" aria-label="Startseite">
              <Image
                src="/womosuche-logo.webp"
                alt="Womosuche"
                width={120}
                height={24}
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/wohnmobile"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Wohnmobile
              </Link>
              <Link
                href="/lexikon"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Lexikon
              </Link>
              <Link
                href="/magazin"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Magazin
              </Link>
            </div>
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user.name && <p className="font-medium">{user.name}</p>}
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Einstellungen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <DropdownMenuItem asChild>
                        <button type="submit" className="flex w-full items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          Abmelden
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                    <LogIn />
                    Anmelden
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    <UserPlus />
                    Registrieren
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

