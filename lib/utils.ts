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
  // Get the date components in local time
  console.log("FORMAT DATE FOR DB------------------------")
  console.log("DATE", date)
  console.log("DATE LOCALE STRING", date.toLocaleString())
  console.log("DATE LOCALE STRING EN", date.toLocaleString('en-US'))
  console.log("DATE LOCALE STRING EN UTC", date.toLocaleString('en-US', { timeZone: 'UTC' }))


  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  console.log("YEAR", year)
  console.log("MONTH", month)
  console.log("DAY", day)

  // Set time to middle of the day in local time to avoid any boundary issues
  return `${year}-${month}-${day} 12:00:00`;
}