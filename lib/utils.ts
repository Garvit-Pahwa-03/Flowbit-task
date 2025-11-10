import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getBaseURL = () => {
  // If the code is running on the server, use the VERCEL_URL.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // If the code is running in the browser, it's relative to the current domain.
  // Fallback to localhost for local development.
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};
