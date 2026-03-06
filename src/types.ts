import { DateTime } from "luxon"

export interface Birthday {
  id: string;
  name: string;
  date: string;
}

export function parseDate(date: string): { month: number; day: number } {
  const [m, d] = date.split("-").map(Number)

  return { month: m, day: d }
}

export function formatDate(month: number, day: number): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function isValidDate(input: string): boolean {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(input)

  if (!match) {return false}
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const dt = DateTime.fromObject({ month, day })

  return dt.isValid
}

export function userInputToDate(input: string): string {
  const [d, m] = input.split("/").map(Number)

  return formatDate(m, d)
}

export function matchesDate(birthday: Birthday, dt: DateTime): boolean {
  const { month, day } = parseDate(birthday.date)

  return month === dt.month && day === dt.day
}

export function isDateAfter(month: number, day: number, refMonth: number, refDay: number): boolean {
  return month > refMonth || (month === refMonth && day > refDay)
}

export function isDateBefore(month: number, day: number, refMonth: number, refDay: number): boolean {
  return month < refMonth || (month === refMonth && day < refDay)
}

export function getCurrentDateParts(timezone: string): { now: DateTime; month: number; day: number } {
  const now = DateTime.now().setZone(timezone)

  return { now, month: now.month, day: now.day }
}

export function daysBetween(now: DateTime, toMonth: number, toDay: number): number {
  let target = DateTime.fromObject(
    { year: now.year, month: toMonth, day: toDay },
    { zone: now.zone },
  )

  if (target <= now) {
    target = target.plus({ years: 1 })
  }

  return Math.ceil(target.diff(now, "days").days)
}

