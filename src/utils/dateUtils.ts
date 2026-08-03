import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'M月d日(E)', { locale: ja });
}

export function formatMonth(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy年M月');
}

export function getWeekRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  return {
    start: toDateString(startOfWeek(date, { weekStartsOn: 1 })),
    end: toDateString(endOfWeek(date, { weekStartsOn: 1 })),
  };
}

export function getMonthRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  return {
    start: toDateString(startOfMonth(date)),
    end: toDateString(endOfMonth(date)),
  };
}

export function getDaysInMonth(dateStr: string): string[] {
  const date = parseISO(dateStr);
  return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) }).map(toDateString);
}

export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return isWithinInterval(parseISO(dateStr), { start: parseISO(start), end: parseISO(end) });
}

export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function getDaysElapsed(start: string, end: string): number {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).length;
}

export function getDayStrings(start: string, end: string): string[] {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(toDateString);
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay(); // 0=日, 1=月, ..., 6=土
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

export function isFuture(dateStr: string): boolean {
  return dateStr > toDateString(new Date());
}
