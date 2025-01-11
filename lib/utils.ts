import { clsx, type ClassValue } from "clsx"
import { format, parse } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTimeRange = (start: string, end: string) => {
  const baseDate = '2024-01-01 '

  const startDate = parse(baseDate + start, 'yyyy-MM-dd HH:mm:ss', new Date())
  const endDate = parse(baseDate + end, 'yyyy-MM-dd HH:mm:ss', new Date())

  const formattedStart = format(startDate, 'hh:mm aa')
  const formattedEnd = format(endDate, 'hh:mm aa')

  return `${formattedStart} - ${formattedEnd}`
}

export function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const formatDateForDB = (date: Date) => {
  // Convert to UTC
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, // Set to noon UTC to avoid any day boundary issues
    0,
    0,
    0
  ));

  const pad = (num: number) => num.toString().padStart(2, '0');

  const year = utcDate.getUTCFullYear();
  const month = pad(utcDate.getUTCMonth() + 1);
  const day = pad(utcDate.getUTCDate());
  const hours = pad(utcDate.getUTCHours());
  const minutes = pad(utcDate.getUTCMinutes());
  const seconds = pad(utcDate.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}