import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type StatusTagProps = Pick<
  TagProps,
  'children' | 'color' | 'icon' | 'className' | 'style'
>;

/**
 * Static status label using Ant Design Tag's native solid variant and colors.
 * @sunxu-component shared
 */
export function StatusTag({
  children,
  color,
  icon,
  className,
  style,
}: StatusTagProps) {
  const resolvedColor = !color || color.toLowerCase() === 'default' ? 'grey' : color;

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
      style={style}
    >
      {children}
    </Tag>
  );
}
