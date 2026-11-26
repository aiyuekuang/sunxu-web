import { ColumnHeightOutlined } from '@ant-design/icons';
import { Dropdown, Tooltip } from 'antd';
import React from 'react';
import {
  setTableDensityKey,
  TABLE_DENSITY_OPTIONS,
  useTableDensityKey,
} from '../theme/tableDensity';

export function TableDensityOption() {
  const currentKey = useTableDensityKey();

  return (
    <Dropdown
      menu={{
        items: TABLE_DENSITY_OPTIONS.map((option) => ({
          key: option.key,
          label: option.label,
          title: option.description,
        })),
        onClick: ({ key }) => {
          const option = TABLE_DENSITY_OPTIONS.find((item) => item.key === key);
          if (option) setTableDensityKey(option.key);
        },
        selectedKeys: [currentKey],
        style: { minWidth: 96 },
      }}
      trigger={['click']}
    >
      <Tooltip title="表格密度">
        <ColumnHeightOutlined aria-label="设置全局表格密度" />
      </Tooltip>
    </Dropdown>
  );
}
