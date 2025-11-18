import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  // Kein Adapter nötig, da wir JWT-Sessions verwenden
  // Der Adapter wird nur für Datenbank-Sessions benötigt
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dynamischer Import für Prisma und bcrypt (nur wenn nicht im Edge Runtime)
        if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
          const { prisma: prismaClient } = await import("@/lib/prisma");
          const bcrypt = await import("bcryptjs");
          
          const user = await prismaClient.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            return null;
          }

          // Prüfe ob E-Mail verifiziert ist
          if (!user.emailVerified) {
            // Verwende einen speziellen Fehlercode, den wir in der Login-Form erkennen können
            const error = new Error("EMAIL_NOT_VERIFIED");
            (error as any).cause = "Bitte bestätige zuerst deine E-Mail-Adresse. Wir haben dir eine Bestätigungsmail gesendet.";
            throw error;
          }

          const isPasswordValid = await bcrypt.default.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

