import dayjs from 'dayjs';
import React from 'react';

export interface DateTextProps {
  value?: string | null;
  format?: 'date' | 'datetime' | 'time';
  placeholder?: string;
}

const FORMAT_MAP = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
} as const;

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Keeps host API date display formats and invalid-value fallback consistent.
 */
export function DateText({
  value,
  format = 'datetime',
  placeholder = '-',
}: DateTextProps) {
  if (!value) return <span>{placeholder}</span>;
  const date = dayjs(value);
  if (!date.isValid()) return <span>{placeholder}</span>;
  return <span>{date.format(FORMAT_MAP[format])}</span>;
}
