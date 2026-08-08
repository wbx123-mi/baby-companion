const WEEKDAY_TEXT = ["日", "一", "二", "三", "四", "五", "六"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDatetimeValue(iso: string): number {
  return new Date(iso).getTime();
}

export function toIsoDatetime(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function formatRecordDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}月${date.getDate()}日 周${WEEKDAY_TEXT[date.getDay()]}`;
}

export function formatRecordTime(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatFullDatetime(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${formatRecordTime(iso)}`;
}

export function formatMonthKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

export function calculateAgeText(birthDate: string, targetIso = new Date().toISOString()): string {
  const birth = new Date(`${birthDate}T00:00:00+08:00`);
  const target = new Date(targetIso);
  const diffDays = Math.max(0, Math.floor((target.getTime() - birth.getTime()) / 86_400_000));

  if (diffDays < 30) {
    return `出生第 ${diffDays + 1} 天`;
  }

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  return days > 0 ? `${months} 个月 ${days} 天` : `${months} 个月`;
}

export function formatBirthText(birthDate: string, birthTime: string | null): string {
  const date = new Date(`${birthDate}T00:00:00+08:00`);
  const dateText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  return birthTime ? `${dateText} ${birthTime.slice(0, 5)}` : dateText;
}

export function todayDateValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function toDateValue(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
