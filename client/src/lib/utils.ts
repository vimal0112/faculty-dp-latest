import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDurationGlobal(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) return "";
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return "";

  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 6) {
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    let result = `${weeks} week${weeks > 1 ? "s" : ""}`;
    if (remainingDays > 0) {
      result += ` ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
    }
    return result;
  }
  return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
}
