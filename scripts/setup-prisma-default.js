const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const defaultPath = path.join(clientPath, 'default');
const pkgClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client', '.prisma', 'client');

// Erstelle default-Verzeichnis falls nicht vorhanden
if (!fs.existsSync(defaultPath)) {
  fs.mkdirSync(defaultPath, { recursive: true });
}

// Erstelle index.js im default-Verzeichnis
// EINFACHSTE LÖSUNG: Exportiere einfach alles aus @prisma/client
// Die zirkuläre Abhängigkeit wird durch Node.js' require.cache verhindert
// Wenn @prisma/client bereits geladen wurde, verwenden wir den Cache
const indexContent = `// Re-export from @prisma/client
// @prisma/client/index.js zeigt auf .prisma/client/default
// Node.js' require.cache verhindert zirkuläre Abhängigkeiten automatisch
module.exports = require('@prisma/client');
`;

fs.writeFileSync(path.join(defaultPath, 'index.js'), indexContent);

// Erstelle index.d.ts für TypeScript-Unterstützung
const indexDtsContent = `export * from '../client';
export * from '../enums';
export * from '../models';
`;

fs.writeFileSync(path.join(defaultPath, 'index.d.ts'), indexDtsContent);

// Erstelle package.json im default-Verzeichnis
const packageJson = {
  main: './index.js',
  types: './index.d.ts',
};

fs.writeFileSync(
  path.join(defaultPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Spiegele generierte JS-Dateien in den von @prisma/client erwarteten Pfad
if (!fs.existsSync(pkgClientPath)) {
  fs.mkdirSync(pkgClientPath, { recursive: true });
}

// Einfache rekursive Kopie (ohne Symlinks)
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursive(clientPath, pkgClientPath);
  console.log('✅ Prisma Client Dateien in @prisma/client/.prisma gespiegelt');
} catch (e) {
  console.warn('⚠️ Konnte Prisma Client Dateien nicht spiegeln:', e?.message);
}

console.log('✅ Prisma default-Verzeichnis eingerichtet');

