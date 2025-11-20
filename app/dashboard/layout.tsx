import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  List,
  MessageSquare,
  BookOpen,
  FileText,
  Settings,
  Users,
  Mail,
  Send,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const navItems = [
    {
      title: "Übersicht",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Wohnmobile",
      href: "/dashboard/listings",
      icon: List,
    },
    {
      title: "Anfragen",
      href: "/dashboard/inquiries",
      icon: MessageSquare,
    },
  ];

  const editorNavItems = [
    {
      title: "Lexikon",
      href: "/dashboard/lexikon",
      icon: BookOpen,
    },
    {
      title: "Magazin",
      href: "/dashboard/magazin",
      icon: FileText,
    },
  ];

  const adminNavItems = [
    {
      title: "Newsletter",
      href: "/dashboard/newsletter",
      icon: Mail,
    },
    {
      title: "Outreach",
      href: "/dashboard/outreach",
      icon: Send,
    },
    {
      title: "Benutzer",
      href: "/dashboard/users",
      icon: Users,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/50 md:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {user.role !== "EDITOR" && navItems
              .filter((item) => {
                // Rechnungen nur für LANDLORDs anzeigen
                if (item.href === "/dashboard/rechnungen" && user.role !== "LANDLORD") {
                  return false;
                }
                return true;
              })
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <span>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </span>
                  </Button>
                </Link>
              ))}
            {(user.role === "ADMIN" || user.role === "EDITOR") && (
              <>
                <div className="my-4 border-t" />
                {editorNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <span>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </span>
                    </Button>
                  </Link>
                ))}
              </>
            )}
            {user.role === "ADMIN" && (
              <>
                <div className="my-4 border-t" />
                {adminNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <span>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </span>
                    </Button>
                  </Link>
                ))}
              </>
            )}
            <div className="my-4 border-t" />
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <span>
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </span>
              </Button>
            </Link>
            {user.role === "LANDLORD" && (
              <Link href="/dashboard/rechnungen">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <span>
                    <Receipt className="mr-2 h-4 w-4" />
                    Rechnungen
                  </span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    </div>
  );
}

