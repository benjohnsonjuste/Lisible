// lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne intelligemment les classes Tailwind CSS 
 * en évitant les conflits et en gérant le conditionnel.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
