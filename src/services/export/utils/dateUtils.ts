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
