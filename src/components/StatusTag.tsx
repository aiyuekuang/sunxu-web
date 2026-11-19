import { Tag } from 'antd';
import type { TagProps } from 'antd';
import type { CSSProperties } from 'react';

const PRESET_COLORS = new Set([
  'default',
  'processing',
  'success',
  'warning',
  'error',
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
]);

type StatusTagStyle = CSSProperties & {
  '--sxw-status-tag-background'?: string;
  '--sxw-status-tag-contrast-fallback'?: string;
};

export type StatusTagProps = Pick<
  TagProps,
  'children' | 'color' | 'icon' | 'className' | 'style'
>;

function parseHexColor(value: string): [number, number, number] | undefined {
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return undefined;

  const hex = match[1].length === 3
    ? [...match[1]].map((digit) => `${digit}${digit}`).join('')
    : match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function getContrastFallback(background: string): string {
  const rgb = parseHexColor(background);
  if (!rgb) return '#ffffff';

  const luminance = rgb
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce((sum, channel, index) =>
      sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return blackContrast >= whiteContrast ? '#000000' : '#ffffff';
}

/**
 * Static, high-contrast status label built on Ant Design Tag.
 * @sunxu-component shared
 */
export function StatusTag({
  children,
  color,
  icon,
  className,
  style,
}: StatusTagProps) {
  const resolvedColor = !color || color.toLowerCase() === 'default' ? '#86909C' : color;
  const isCustomColor = !PRESET_COLORS.has(resolvedColor.toLowerCase());
  const customBackground =
    typeof style?.backgroundColor === 'string' ? style.backgroundColor : resolvedColor;

  const statusTagStyle: StatusTagStyle = {
    ...style,
    ...(isCustomColor
      ? {
          '--sxw-status-tag-background': customBackground,
          '--sxw-status-tag-contrast-fallback': getContrastFallback(customBackground),
        }
      : {}),
  };

  return (
    <Tag
      variant="solid"
      color={resolvedColor}
      icon={icon}
      className={[
        'sxw-status-tag',
        isCustomColor ? 'sxw-status-tag--custom' : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={statusTagStyle}
    >
      {children}
    </Tag>
  );
}
