import { App, Button, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import { usePurchaseReceiptCapabilities } from '../../providers/BusinessUiProvider';

export interface GeneratePurchaseReceiptBatchNoButtonProps {
  materialId?: string;
  batchNo?: string;
  onGenerated: (batchNo: string) => void;
}

/**
 * @sunxu-layer business
 * @sunxu-domain procurement
 * @sunxu-reason Retains host purchase receipt batch-number generation feedback while the host supplies the numbering service and row update.
 */
export function GeneratePurchaseReceiptBatchNoButton({
  materialId,
  batchNo,
  onGenerated,
}: GeneratePurchaseReceiptBatchNoButtonProps) {
  const { message } = App.useApp();
  const capabilities = usePurchaseReceiptCapabilities();
  const [loading, setLoading] = useState(false);
  const batchNoRef = useRef(batchNo);
  batchNoRef.current = batchNo;

  const handleGenerate = async () => {
    if (!materialId || batchNoRef.current?.trim() || loading) return;

    setLoading(true);
    try {
      const requestSystemBatchNo = capabilities?.generateSystemBatchNo;
      if (!requestSystemBatchNo) throw new Error('系统批号服务未配置');
      const result = await requestSystemBatchNo({ materialId });
      const generatedBatchNo = result?.batchNo?.trim();
      if (!generatedBatchNo) throw new Error('系统未返回批号');
      if (!batchNoRef.current?.trim()) {
        onGenerated(generatedBatchNo);
        message.success('系统批号已写入当前明细');
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '自动生成系统批号失败',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="按批号编号规则生成，并写入当前明细">
      <Button
        size="small"
        loading={loading}
        disabled={!materialId || Boolean(batchNo?.trim()) || loading}
        onClick={() => void handleGenerate()}
      >
        自动写入
      </Button>
    </Tooltip>
  );
}
