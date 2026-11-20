import { FileImageOutlined } from '@ant-design/icons';
import { Image, Tooltip } from 'antd';
import React from 'react';

const BROKEN_IMAGE_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="broken image">
  <rect x="1" y="1" width="62" height="62" rx="8" fill="#f8fafc"/>
  <rect x="12" y="13" width="40" height="38" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  <circle cx="24" cy="26" r="4" fill="#94a3b8"/>
  <path d="M16 46l10-12 7 8 5-6 10 10H16z" fill="#cbd5e1"/>
  <path d="M35 13l-7 11 9 5-8 12 5 10" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)}`;

export interface EntityThumbnailProps {
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  alt?: string;
  size?: number;
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain shared-data
 * @sunxu-reason Provides MES record thumbnail fallbacks and prevents image actions from triggering row actions.
 */
export function EntityThumbnail({
  thumbnailUrl,
  previewUrl,
  alt = '缩略图',
  size = 40,
}: EntityThumbnailProps) {
  const displayUrl = thumbnailUrl || previewUrl;
  const resolvedPreviewUrl = previewUrl || displayUrl;
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 6,
    border: '1px solid var(--ant-color-border-secondary)',
    background: 'var(--ant-color-fill-quaternary)',
  };

  if (!displayUrl) {
    return (
      <Tooltip title="暂无图片">
        <span
          style={{
            ...baseStyle,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ant-color-text-tertiary)',
          }}
        >
          <FileImageOutlined />
        </span>
      </Tooltip>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        verticalAlign: 'middle',
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Image
        src={displayUrl}
        alt={alt}
        width={size}
        height={size}
        style={{ ...baseStyle, objectFit: 'cover' }}
        styles={{
          root: {
            display: 'inline-flex',
            width: size,
            height: size,
            verticalAlign: 'middle',
          },
        }}
        fallback={BROKEN_IMAGE_FALLBACK}
        preview={
          resolvedPreviewUrl ? { src: resolvedPreviewUrl, mask: null } : false
        }
      />
    </span>
  );
}
