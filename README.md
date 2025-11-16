# Wohnmobil Vermietung Plattform

Eine moderne Next.js-Plattform zur Vermittlung von Wohnmobilen mit Vermieter-Dashboard, Admin-Bereich, Lexikon und Magazin.

## Features

- 🏕️ **Wohnmobil-Katalog**: Öffentlicher Katalog mit Filtern und Pagination
- 👤 **Vermieter-Dashboard**: CRUD-Verwaltung für Wohnmobile
- 📧 **Buchungsanfragen**: System für Anfragen mit E-Mail-Benachrichtigungen
- 📚 **Lexikon**: Verwaltung von Fachbegriffen (Admin)
- 📰 **Magazin**: Artikel-Verwaltung für Fachartikel (Admin)
- 🔐 **Authentifizierung**: Rollenbasierte Zugriffskontrolle (ADMIN/LANDLORD)
- 📸 **Bild-Upload**: Integration mit Vercel Blob Storage
- ✉️ **E-Mail**: Resend Integration für Transaktions-E-Mails

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS + SHADCN UI
- **Datenbank**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentifizierung**: Auth.js (NextAuth)
- **Storage**: Vercel Blob
- **E-Mail**: Resend

## Setup

### 1. Umgebungsvariablen

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Resend
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Datenbank migrieren

```bash
npm run db:migrate
```

### 4. Admin-User erstellen

```bash
npm run db:seed
```

Standard-Credentials:
- Email: `admin@wohnmobil.de`
- Password: `admin123`

**Wichtig**: Ändern Sie das Passwort nach dem ersten Login!

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. Verbinden Sie Ihr GitHub-Repository mit Vercel
2. Fügen Sie alle Umgebungsvariablen in den Vercel-Einstellungen hinzu
3. Stellen Sie sicher, dass die Build-Kommandos korrekt sind:
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Neon Database

1. Erstellen Sie eine neue Datenbank auf [Neon](https://neon.tech)
2. Kopieren Sie die `DATABASE_URL` in Ihre Umgebungsvariablen
3. Führen Sie die Migrationen aus: `npm run db:migrate`

### Vercel Blob Storage

1. Erstellen Sie ein Blob Storage in Ihrem Vercel-Projekt
2. Kopieren Sie den `BLOB_READ_WRITE_TOKEN` in Ihre Umgebungsvariablen

### Resend E-Mail

1. Erstellen Sie ein Konto auf [Resend](https://resend.com)
2. Generieren Sie einen API-Key
3. Verifizieren Sie Ihre Domain für E-Mail-Versand
4. Fügen Sie `RESEND_API_KEY` und `RESEND_FROM_EMAIL` zu Ihren Umgebungsvariablen hinzu

## Projektstruktur

```
├── app/                    # Next.js App Router Seiten
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard-Bereich
│   ├── wohnmobile/        # Öffentliche Wohnmobil-Seiten
│   ├── lexikon/           # Lexikon-Seiten
│   └── magazin/           # Magazin-Seiten
├── components/            # React Komponenten
├── lib/                   # Utility-Funktionen
├── prisma/               # Prisma Schema & Migrations
└── emails/               # E-Mail Templates
```

## Scripts

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt Production-Build
- `npm run start` - Startet Production-Server
- `npm run db:generate` - Generiert Prisma Client
- `npm run db:migrate` - Führt Datenbank-Migrationen aus
- `npm run db:seed` - Erstellt Seed-Daten (Admin-User)

## Rollen

- **ADMIN**: Vollzugriff auf alle Funktionen
- **LANDLORD**: Kann nur eigene Wohnmobile verwalten

## Lizenz

MIT
