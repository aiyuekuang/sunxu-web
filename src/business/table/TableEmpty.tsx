import { Empty } from 'antd';
import React, { type ReactNode } from 'react';

export interface TableEmptyProps {
  /**
   * 业务下一步引导：这类数据由哪个上游单据/动作生成、需要先维护什么配置，
   * 或当前筛选无结果应如何调整。各业务页通过 `emptyGuidance` 传入。
   */
  guidance?: ReactNode;
  /** 覆盖默认主文案（默认“暂无数据”）。 */
  description?: ReactNode;
}

const DEFAULT_GUIDANCE =
  '若已设置筛选条件，请调整后重试；新数据通常由上游业务单据或对应配置生成。';

/**
 * 列表统一空态：在“暂无数据”之外补一行业务引导，避免裸空态成为操作死路。
 * 作为 ResizableProTable / ResizableTable 的默认 `locale.emptyText` 注入，
 * 调用方可通过 `locale.emptyText` 覆盖，或通过 `emptyGuidance` 仅替换引导文案。
 */
export function TableEmpty({ guidance, description }: TableEmptyProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span
          style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}
        >
          <span>{description ?? '暂无数据'}</span>
          <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
            {guidance ?? DEFAULT_GUIDANCE}
          </span>
        </span>
      }
    />
  );
}
