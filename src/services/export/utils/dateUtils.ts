export function getISOWeek(date: string | Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function getISOWeekYear(date: string | Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return d.getFullYear();
}

export function getISOWeekDateRange(year: number, week: number): string {
  // Funzione semplice: 
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const isoStart = new Date(simple);
  if (dow <= 4) {
    isoStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    isoStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const isoEnd = new Date(isoStart);
  isoEnd.setDate(isoStart.getDate() + 6);
  
  const formatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  // Ritorna es: "09/06/2026 - 15/06/2026"
  return `${formatter.format(isoStart)} - ${formatter.format(isoEnd)}`;
}



export function parseDateSafe(dateVal: string | Date | undefined | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    return new Date(Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 0, 0, 0, 0));
  }
  if (typeof dateVal !== 'string') return null;
  const trimmed = dateVal.trim();
  if (!trimmed) return null;

  const isoDatePart = trimmed.split('T')[0];
  const parts = isoDatePart.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    // Verify impossible dates like 31 Feb
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day) {
      return d;
    }
    return null;
  }
  return null;
}
