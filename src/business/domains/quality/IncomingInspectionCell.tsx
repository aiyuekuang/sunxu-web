import { Button, Space, Tooltip, Typography } from 'antd';
import type { StatusMap } from '../../../components/StatusDisplay';
import { StatusDisplay } from '../../../components/StatusDisplay';

export interface IncomingInspectionCellProps {
  qualityGateStatus?: string;
  qualityGateReason?: string | null;
  qualityInspection?: {
    id: string;
    inspectionNo: string;
    status: string;
  } | null;
  canViewInspection: boolean;
  qualityGateStatusEnum: StatusMap;
  inspectionStatusEnum: StatusMap;
  /** The host applies its route and authorization contract before invoking. */
  onOpenInspection?: (inspectionId: string) => void;
}

/**
 * @sunxu-layer business
 * @sunxu-domain quality receiving and incoming quality inspection
 * @sunxu-reason Keeps the receipt quality gate and linked inspection visible while the host owns status dictionaries, authorization, and navigation.
 *
 * Displays the quality-gate result and its linked incoming inspection in a
 * purchase-receipt detail row.
 */
export function IncomingInspectionCell({
  qualityGateStatus,
  qualityGateReason,
  qualityInspection,
  canViewInspection,
  qualityGateStatusEnum,
  inspectionStatusEnum,
  onOpenInspection,
}: IncomingInspectionCellProps) {
  if (!qualityGateStatus) {
    return <Typography.Text type="danger">质检状态未返回</Typography.Text>;
  }

  const gateStatus = (
    <StatusDisplay value={qualityGateStatus} enumMap={qualityGateStatusEnum} />
  );
  const inspectionStatusText = qualityInspection
    ? (inspectionStatusEnum[qualityInspection.status]?.text ??
      qualityInspection.status)
    : null;

  return (
    <Space orientation="vertical" size={2}>
      {qualityGateReason ? (
        <Tooltip title={qualityGateReason}>
          <span
            tabIndex={0}
            aria-label={`质检门禁状态：${qualityGateStatus}；原因：${qualityGateReason}`}
          >
            {gateStatus}
          </span>
        </Tooltip>
      ) : (
        gateStatus
      )}
      {qualityInspection ? (
        <Space size={4} wrap>
          {canViewInspection && onOpenInspection ? (
            <Button
              type="link"
              size="small"
              aria-label={`查看质检单 ${qualityInspection.inspectionNo}`}
              onClick={() => onOpenInspection(qualityInspection.id)}
              style={{ paddingInline: 0, height: 'auto' }}
            >
              {qualityInspection.inspectionNo}
            </Button>
          ) : (
            <Typography.Text>{qualityInspection.inspectionNo}</Typography.Text>
          )}
          <Typography.Text type="secondary">
            {inspectionStatusText}
          </Typography.Text>
        </Space>
      ) : null}
    </Space>
  );
}
