type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassArray = ClassValue[];
type ClassValue = string | number | null | boolean | undefined | ClassDictionary | ClassArray;

function toClassName(value: ClassValue): string {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, include]) => Boolean(include))
      .map(([key]) => key)
      .join(" ");
  }
  return "";
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toClassName).filter(Boolean).join(" ");
}
