import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge tailwind CSS classes with automatic conflict resolution
 * Combines clsx for conditional classes with twMerge for Tailwind conflicts
 * @param inputs - Classes to merge
 * @returns Merged classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
