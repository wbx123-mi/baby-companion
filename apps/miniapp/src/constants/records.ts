import type { RecordType } from "@/types/domain";

export const RECORD_TYPE_OPTIONS: Array<{
  value: RecordType;
  label: string;
  emoji: string;
}> = [
  { value: "DAILY", label: "日常", emoji: "☀️" },
  { value: "FIRST", label: "第一次", emoji: "🌱" },
  { value: "FAMILY", label: "家人时光", emoji: "🏠" },
  { value: "OTHER", label: "其他", emoji: "✨" },
];

export function getRecordTypeLabel(type: RecordType): string {
  return RECORD_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "其他";
}

export function getRecordTypeEmoji(type: RecordType): string {
  return RECORD_TYPE_OPTIONS.find((item) => item.value === type)?.emoji ?? "✨";
}
