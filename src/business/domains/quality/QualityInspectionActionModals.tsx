import { Alert, Button, Space, Spin, Typography } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QualityInspectionDefectModal } from './QualityInspectionDefectModal';
import { QualityInspectionSubmitModal } from './QualityInspectionSubmitModal';
import type {
  QualityInspectionDefectModalCapabilities,
  QualityInspectionDefectRecord,
  QualityInspectionItemRecord,
  QualityInspectionSubmitCapabilities,
  QualityInspectionType,
} from './quality-inspection-modal-types';

export interface QualityInspectionActionDetailRecord {
  id: string;
  type: QualityInspectionType;
  items?: QualityInspectionItemRecord[] | null;
  defects?: QualityInspectionDefectRecord[] | null;
}

export type QualityInspectionActionModalsProps = {
  inspection: { id: string } | null;
  submitOpen: boolean;
  defectOpen: boolean;
  lineCustomFieldSchema?: unknown | null;
  onSubmitOpenChange: (open: boolean) => void;
  onDefectOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  capabilities: {
    loadDetail: (
      inspectionId: string,
    ) => Promise<QualityInspectionActionDetailRecord | null>;
    submit: QualityInspectionSubmitCapabilities;
    defect: QualityInspectionDefectModalCapabilities;
  };
};

/**
 * @sunxu-layer business
 * @sunxu-domain quality
 * @sunxu-reason Preserves the detail-loading/retry gate that opens submission and defect dialogs while the inspection query, custom-field schema, and workflow services remain host supplied.
 */
export function QualityInspectionActionModals({
  inspection,
  submitOpen,
  defectOpen,
  lineCustomFieldSchema,
  onSubmitOpenChange,
  onDefectOpenChange,
  onSuccess,
  capabilities,
}: QualityInspectionActionModalsProps) {
  const requestIdRef = useRef(0);
  const loadDetailRef = useRef(capabilities.loadDetail);
  loadDetailRef.current = capabilities.loadDetail;
  const [detail, setDetail] =
    useState<QualityInspectionActionDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback((inspectionId: string) => {
    const requestId = ++requestIdRef.current;
    setDetail(null);
    setLoadError(null);
    setLoading(true);
    void loadDetailRef.current(inspectionId)
      .then((nextDetail) => {
        if (requestIdRef.current === requestId) setDetail(nextDetail);
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          setLoadError('质检单加载失败，请重试');
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
    return requestId;
  }, []);

  useEffect(() => {
    if (!inspection || (!submitOpen && !defectOpen)) return;
    const requestId = load(inspection.id);
    return () => {
      if (requestIdRef.current === requestId) requestIdRef.current += 1;
    };
  }, [inspection, submitOpen, defectOpen, load]);

  const retryLoad = () => {
    if (!inspection) return;
    load(inspection.id);
  };

  if (!inspection) return null;
  if (!detail && (submitOpen || defectOpen)) {
    return loadError ? (
      <Space orientation="vertical" style={{ padding: 24 }}>
        <Alert type="error" showIcon message={loadError} />
        <Button onClick={retryLoad}>重试</Button>
        <Button
          type="link"
          onClick={() => {
            onSubmitOpenChange(false);
            onDefectOpenChange(false);
          }}
        >
          关闭
        </Button>
      </Space>
    ) : (
      <Space style={{ padding: 24 }}>
        <Spin />
        <Typography.Text>正在加载质检单…</Typography.Text>
      </Space>
    );
  }
  if (!detail || loading) return null;

  const initialValues = {
    recordType: detail.type === 'ipqc' ? ('process' as const) : undefined,
    sampleQty: undefined,
    passQty: undefined,
    failQty: undefined,
    conclusion: undefined,
    remarks: undefined,
  };

  return (
    <>
      <QualityInspectionSubmitModal
        open={submitOpen}
        onOpenChange={onSubmitOpenChange}
        inspectionId={detail.id}
        inspectionType={detail.type}
        items={detail.items ?? []}
        defects={detail.defects ?? []}
        initialValues={initialValues}
        lineCustomFieldSchema={lineCustomFieldSchema}
        onDefectsChange={onSuccess}
        onSuccess={onSuccess}
        capabilities={capabilities.submit}
      />
      <QualityInspectionDefectModal
        open={defectOpen}
        onOpenChange={onDefectOpenChange}
        inspectionId={detail.id}
        onSuccess={async () => {
          await onSuccess();
        }}
        capabilities={capabilities.defect}
      />
    </>
  );
}
