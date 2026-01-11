import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number to IDR format with dot separators (e.g., 1.500.000)
export function formatIDR(value: string | number): string {
  const numStr = String(value).replace(/\D/g, "");
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse IDR formatted string back to number
export function parseIDR(formatted: string): number {
  return parseInt(formatted.replace(/\./g, ""), 10) || 0;
}
