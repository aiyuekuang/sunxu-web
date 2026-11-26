import React from 'react';

export interface UserTextProps {
  user?: { realName?: string; username?: string } | null;
  placeholder?: string;
}

/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Reads the host user snapshot fields used in list and detail records.
 */
export function UserText({ user, placeholder = '—' }: UserTextProps) {
  if (!user) return <span>{placeholder}</span>;
  return <span>{user.realName || user.username || placeholder}</span>;
}
