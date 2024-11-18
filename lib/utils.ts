import { clsx, type ClassValue } from "clsx"
import { format, parse } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTimeRange = (start: string, end: string) => {
  // Add a dummy date to create valid date objects
  const baseDate = '2024-01-01 '

  // Parse the time strings into Date objects
  const startDate = parse(baseDate + start, 'yyyy-MM-dd HH:mm:ss', new Date())
  const endDate = parse(baseDate + end, 'yyyy-MM-dd HH:mm:ss', new Date())

  // Format the times in 12-hour format
  const formattedStart = format(startDate, 'hh:mm aa')
  const formattedEnd = format(endDate, 'hh:mm aa')

  return `${formattedStart} - ${formattedEnd}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}