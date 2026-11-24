import { ProDescriptions } from '@ant-design/pro-components';
import { Button, Divider, Drawer, Image, Space, Tag, Typography } from 'antd';
import type { MouseEvent } from 'react';
import type {
  ReportLogDetailDrawerProps,
  ReportLogDetailRecord,
  ReportLogStatusOption,
} from './report-log-detail-drawer-types';
import { formatUnitLabel } from '../utils/qty-unit';

function displayValue(value?: string | number | null): string {
  return value === undefined || value === null || value === ''
    ? '—'
    : String(value);
}

function formatQtyWithUnit(
  value: number | null | undefined,
  unit: string | null | undefined,
  unitLabelMap: Readonly<Record<string, string>>,
): string {
  if (value === undefined || value === null) return '—';
  const unitLabel = formatUnitLabel(unit, unitLabelMap);
  return unitLabel ? `${value} ${unitLabel}` : String(value);
}

function getStatusOption(
  dictionary: Readonly<Record<string, ReportLogStatusOption | undefined>>,
  value?: string | null,
): ReportLogStatusOption | undefined {
  return value ? dictionary[value] : undefined;
}

function PhotoGroup({ title, urls }: { title: string; urls?: string[] }) {
  const validUrls = (urls ?? []).filter(Boolean);

  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      {validUrls.length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap style={{ display: 'flex', marginTop: 10 }}>
            {validUrls.map((url, index) => (
              <Image
                key={`${url}-${index}`}
                src={url}
                alt={`${title}${index + 1}`}
                width={88}
                height={88}
                style={{
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: '1px solid var(--ant-color-border-secondary)',
                }}
              />
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : (
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginTop: 8 }}
        >
          未上传
        </Typography.Text>
      )}
    </div>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain production
 * @sunxu-reason Preserves the read-only MES report-log detail workflow while status dictionaries, permissions, date/pay formatting, derived scrap-rate presentation, and navigation stay host supplied.
 */
export function ReportLogDetailDrawer({
  open,
  record,
  materialUnitLabelMap,
  operationUnitLabelMap,
  statusDictionaries,
  canViewProductionScrap,
  formatDateTimeSeconds,
  formatPayPreviewText,
  getScrapRatePresentation,
  navigate,
  onClose,
}: ReportLogDetailDrawerProps) {
  if (!record) return null;

  const typeLabel = record.type === 'revoke' ? '冲正' : '报工';
  const typeColor = record.type === 'revoke' ? 'orange' : 'blue';
  const workOrderStatus = getStatusOption(
    statusDictionaries.workOrder,
    record.workOrderStatus,
  );
  const scrapStatus = getStatusOption(
    statusDictionaries.productionScrap,
    record.productionScrapStatus,
  );
  const quantityRole = record.quantityRole
    ? (getStatusOption(statusDictionaries.quantityRole, record.quantityRole)
        ?.text ?? record.quantityRole)
    : '—';
  const timeSource = record.timeSource
    ? (getStatusOption(statusDictionaries.timeSource, record.timeSource)?.text ??
      record.timeSource)
    : '—';
  const pieceworkQtyBasis = record.pieceworkQtyBasisSnapshot
    ? (getStatusOption(
        statusDictionaries.pieceworkQtyBasis,
        record.pieceworkQtyBasisSnapshot,
      ) ?? { text: record.pieceworkQtyBasisSnapshot })
    : undefined;
  const scrapRate = getScrapRatePresentation({
    type: record.type,
    completedQty: record.completedQty,
    scrappedQty: record.scrappedQty,
  });

  const goToWorkOrder = () => {
    if (!record.workOrderId) return;
    onClose();
    navigate(`/production/work-orders/${record.workOrderId}`);
  };

  const handleLinkNavigation = (
    event: MouseEvent<HTMLElement>,
    path: string,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onClose();
    navigate(path);
  };

  return (
    <Drawer
      title={
        <Space>
          <span>报工详情</span>
          <Tag color={typeColor}>{typeLabel}</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      size={640}
      destroyOnHidden
      extra={
        record.workOrderId ? (
          <Button type="link" onClick={goToWorkOrder}>
            查看工单
          </Button>
        ) : undefined
      }
    >
      <ProDescriptions
        bordered
        size="small"
        column={2}
        dataSource={record}
        columns={[
          {
            title: '工单号',
            render: () =>
              record.workOrderId ? (
                <Typography.Link
                  href={`/production/work-orders/${record.workOrderId}`}
                  onClick={(event) =>
                    handleLinkNavigation(
                      event,
                      `/production/work-orders/${record.workOrderId}`,
                    )
                  }
                >
                  {displayValue(record.orderNo)}
                </Typography.Link>
              ) : (
                displayValue(record.orderNo)
              ),
          },
          {
            title: '工单状态',
            render: () =>
              workOrderStatus ? (
                <Tag color={workOrderStatus.color}>{workOrderStatus.text}</Tag>
              ) : (
                '—'
              ),
          },
          {
            title: '物料名称',
            render: () => displayValue(record.materialName),
          },
          {
            title: '物料编码',
            render: () => displayValue(record.materialCode),
          },
          {
            title: '规格型号',
            render: () => displayValue(record.materialSpec),
          },
          {
            title: '工序',
            render: () => record.operationName || '整单报工',
          },
          {
            title: '报工类型',
            render: () => <Tag color={typeColor}>{typeLabel}</Tag>,
          },
          {
            title: '报工人',
            render: () => displayValue(record.reporterName),
          },
        ]}
      />

      <Divider titlePlacement="start" plain>
        数量与口径
      </Divider>
      <ProDescriptions
        bordered
        size="small"
        column={2}
        dataSource={record}
        columns={[
          {
            title: '完成数量',
            render: () =>
              formatQtyWithUnit(
                record.completedQty,
                record.materialUnit,
                materialUnitLabelMap,
              ),
          },
          {
            title: '报废数量',
            render: () =>
              formatQtyWithUnit(
                record.scrappedQty,
                record.materialUnit,
                materialUnitLabelMap,
              ),
          },
          {
            title: '折算产品良品',
            render: () =>
              formatQtyWithUnit(
                record.convertedCompletedQty,
                record.materialUnit,
                materialUnitLabelMap,
              ),
          },
          {
            title: '折算产品报废',
            render: () =>
              formatQtyWithUnit(
                record.convertedScrappedQty,
                record.materialUnit,
                materialUnitLabelMap,
              ),
          },
          {
            title: '数量角色',
            render: () => quantityRole,
          },
          {
            title: '报废率',
            render: () =>
              scrapRate ? (
                <Tag color={scrapRate.color}>{scrapRate.text}</Tag>
              ) : (
                '—'
              ),
          },
          {
            title: '执行数量',
            render: () =>
              formatQtyWithUnit(
                record.executionQty,
                record.executionUnit,
                operationUnitLabelMap,
              ),
          },
          {
            title: '工序报工量',
            render: () =>
              formatQtyWithUnit(
                record.reportedOperationQty,
                record.reportedOperationUnit,
                operationUnitLabelMap,
              ),
          },
          {
            title: '批号',
            render: () => displayValue(record.batchNo),
          },
          {
            title: '计件基准',
            render: () =>
              pieceworkQtyBasis ? (
                <Tag color={pieceworkQtyBasis.color}>
                  {pieceworkQtyBasis.text}
                </Tag>
              ) : (
                '—'
              ),
          },
        ]}
      />

      <Divider titlePlacement="start" plain>
        执行与时间
      </Divider>
      <ProDescriptions
        bordered
        size="small"
        column={2}
        dataSource={record}
        columns={[
          {
            title: '设备',
            render: () => displayValue(record.equipmentName),
          },
          {
            title: '工作中心ID',
            render: () => displayValue(record.workCenterId),
          },
          {
            title: '工时',
            render: () =>
              record.durationMinutes == null
                ? '—'
                : `${record.durationMinutes} 分钟`,
          },
          {
            title: '工时来源',
            render: () => timeSource,
          },
          {
            title: '开始时间',
            render: () => formatDateTimeSeconds(record.startedAt),
          },
          {
            title: '结束时间',
            render: () => formatDateTimeSeconds(record.endedAt),
          },
          {
            title: '实际发生时间',
            render: () => formatDateTimeSeconds(record.occurredAt),
          },
          {
            title: '创建时间',
            render: () => formatDateTimeSeconds(record.createdAt),
          },
          {
            title: '辅助操作',
            render: () => (record.isAuxiliary ? '是' : '否'),
          },
          {
            title: '工价状态',
            render: () => formatPayPreviewText(record.payPreview),
          },
        ]}
      />

      <Divider titlePlacement="start" plain>
        报废与现场证据
      </Divider>
      <ProDescriptions
        bordered
        size="small"
        column={1}
        dataSource={record}
        columns={[
          {
            title: '生产报废单',
            render: () => (
              <>
                {record.productionScrapId && canViewProductionScrap ? (
                  <Typography.Link
                    href={`/production/scraps/${record.productionScrapId}`}
                    onClick={(event) =>
                      handleLinkNavigation(
                        event,
                        `/production/scraps/${record.productionScrapId}`,
                      )
                    }
                  >
                    {displayValue(record.productionScrapNo)}
                  </Typography.Link>
                ) : (
                  displayValue(record.productionScrapNo)
                )}
                {scrapStatus ? (
                  <Tag color={scrapStatus.color} style={{ marginLeft: 8 }}>
                    {scrapStatus.text}
                  </Tag>
                ) : null}
              </>
            ),
          },
          {
            title: '报废处置',
            render: () =>
              record.productionScrapNo
                ? `待处理 ${record.productionScrapPendingQty ?? 0}；保留报废 ${record.productionScrapResolvedScrapQty ?? 0}；转非报废 ${record.productionScrapResolvedNonScrapQty ?? 0}；让步接收 ${record.productionScrapResolvedConcessionQty ?? 0}`
                : '—',
          },
          {
            title: '报废原因',
            render: () => displayValue(record.scrapReason),
          },
          {
            title: '零数量/执行原因',
            render: () =>
              displayValue(record.zeroQuantityReason || record.executionReason),
          },
          {
            title: '备注',
            render: () => displayValue(record.remark),
          },
        ]}
      />
      <Space
        orientation="vertical"
        size={20}
        style={{ display: 'flex', marginTop: 20 }}
      >
        <PhotoGroup title="现场照片" urls={record.photoUrls} />
        <PhotoGroup title="报废照片" urls={record.scrapPhotoUrls} />
      </Space>

      <Divider titlePlacement="start" plain>
        追溯标识
      </Divider>
      <ProDescriptions
        bordered
        size="small"
        column={1}
        dataSource={record}
        columns={[
          {
            title: '报工记录ID',
            render: () => <Typography.Text copyable>{record.id}</Typography.Text>,
          },
          {
            title: '工单ID',
            render: () => (
              <Typography.Text copyable>{record.workOrderId}</Typography.Text>
            ),
          },
          {
            title: '工序ID',
            render: () => (
              <Typography.Text copyable>
                {displayValue(record.operationId)}
              </Typography.Text>
            ),
          },
          {
            title: '排产实例ID',
            render: () => (
              <Typography.Text copyable>
                {displayValue(record.scheduleEntryId)}
              </Typography.Text>
            ),
          },
          {
            title: '设备会话ID',
            render: () => (
              <Typography.Text copyable>
                {displayValue(record.equipmentSessionId)}
              </Typography.Text>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

export default ReportLogDetailDrawer;
export type { ReportLogDetailDrawerProps };
