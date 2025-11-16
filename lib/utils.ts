import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Entfernt versehentlich mitgelieferte Markdown-Codezäune (``` bzw. ```html)
// und bereinigt führende/abschließende Leerzeichen.
export function sanitizeAiHtml(input: string): string {
  if (!input) return input
  let out = input
  // Entferne führenden Codezaun wie ```html\n
  out = out.replace(/^\s*```(?:html|htm|xml|markdown|md)?\s*(?:\r?\n)?/i, "")
  // Entferne abschließenden Codezaun am Ende
  out = out.replace(/(?:\r?\n)?\s*```+\s*$/i, "")
  // Entferne evtl. verbliebene einzelne Backtick-Zäune
  out = out.replace(/```(?:html|htm|xml|markdown|md)?/gi, "")
  out = out.replace(/```/g, "")
  // Falls trotzdem Backticks am Ende stehen, entfernen
  out = out.replace(/[`]+$/g, "")
  return out.trim()
}
