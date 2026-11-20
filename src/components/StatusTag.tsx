import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type StatusTagProps = Pick<
  TagProps,
  'children' | 'color' | 'icon' | 'className' | 'style'
>;

function parseHexColor(value: string): [number, number, number] | undefined {
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return undefined;

  const hex =
    match[1].length === 3
      ? [...match[1]].map((digit) => `${digit}${digit}`).join('')
      : match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function getWhiteContrast(rgb: [number, number, number]): number {
  const weights = [0.2126, 0.7152, 0.0722];
  const luminance = rgb.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear =
      normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    return sum + linear * weights[index];
  }, 0);
  return 1.05 / (luminance + 0.05);
}

function withWhiteTextContrast(background: string): string {
  const rgb = parseHexColor(background);
  if (!rgb || getWhiteContrast(rgb) >= 4.5) return background;

  let minScale = 0;
  let maxScale = 1;
  for (let index = 0; index < 16; index += 1) {
    const scale = (minScale + maxScale) / 2;
    const candidate = rgb.map((channel) => Math.round(channel * scale)) as [
      number,
      number,
      number,
    ];
    if (getWhiteContrast(candidate) >= 4.5) minScale = scale;
    else maxScale = scale;
  }

  const darkened = rgb.map((channel) => Math.round(channel * minScale)) as [
    number,
    number,
    number,
  ];
  while (getWhiteContrast(darkened) < 4.5) {
    darkened.forEach((channel, index) => {
      darkened[index] = Math.max(0, channel - 1);
    });
  }

  return `#${darkened.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
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
  const requestedColor = !color || color.toLowerCase() === 'default' ? '#86909C' : color;
  const resolvedColor = withWhiteTextContrast(requestedColor);
  const resolvedStyle =
    typeof style?.backgroundColor === 'string'
      ? { ...style, backgroundColor: withWhiteTextContrast(style.backgroundColor) }
      : style;

  return (
    <Tag
      variant="solid"
      color={resolvedColor}
      icon={icon}
      className={[
        'sxw-status-tag',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={resolvedStyle}
    >
      {children}
    </Tag>
  );
}
