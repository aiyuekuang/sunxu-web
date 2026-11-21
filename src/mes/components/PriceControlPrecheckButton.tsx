import { Alert, App, Button, Modal, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMesPriceControlCapabilities } from '../MesUiProvider';
import { PermissionButton } from './PermissionButton';
import type {
  PriceControlDecision,
  PriceControlDomain,
  PriceControlPrecheckLine,
  PriceControlPrecheckRequest,
  PriceControlPrecheckResult,
  PriceExceptionPartyType,
} from './price-control-types';

export type PrecheckLineInput = Omit<
  PriceControlPrecheckLine,
  | 'sourceItemId'
  | 'quantity'
  | 'estimatedCost'
  | 'bomCostSnapshot'
  | 'label'
  | 'taxRate'
  | 'priceIncludesTax'
> & {
  sourceItemId?: string | null;
  quantity?: number | null;
  estimatedCost?: number | null;
  bomCostSnapshot?: Record<string, unknown> | null;
  label?: string | null;
  taxRate?: number | null;
  priceIncludesTax?: boolean | null;
};

export interface PriceControlPrecheckButtonProps {
  domain: PriceControlDomain;
  sourceType: string;
  sourceId: string;
  partyType: PriceExceptionPartyType;
  partyId?: string | null;
  partyLevel?: string | null;
  asOfDate?: string | null;
  buildLines: () => PrecheckLineInput[];
  permission?: string;
  visible?: boolean;
  onConfirm: () => Promise<unknown>;
  successMessage?: string;
  onSuccess?: () => void;
  children?: ReactNode;
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  confirmTitle?: string;
  confirmContent?: ReactNode;
  beforeCheck?: () => boolean;
  autoRun?: boolean;
  autoRunToken?: string | number;
}

function filterNullish<T extends object>(input: T): T {
  const output = { ...input } as T;
  const record = output as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (record[key] === null || record[key] === undefined) delete record[key];
  }
  return output;
}

function formatPrice(value?: number | null): string {
  return value == null || Number.isNaN(value) ? '-' : Number(value).toFixed(2);
}

function DecisionList({
  decisions,
}: {
  decisions: PriceControlDecision[];
}) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      {decisions.map((decision, index) => (
        <div key={`${decision.ruleId}-${decision.sourceItemId ?? index}`}>
          <Space size={4} wrap>
            <Tag>{decision.ruleName}</Tag>
            <Typography.Text>{decision.message}</Typography.Text>
          </Space>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, marginLeft: 4 }}
          >
            录入价 {formatPrice(decision.enteredUnitPrice)}
            {decision.controlUnitPrice != null
              ? ` · 控制价 ${formatPrice(decision.controlUnitPrice)}`
              : ''}
            {decision.grossMarginRate != null
              ? ` · 毛利率 ${Number(decision.grossMarginRate).toFixed(2)}%`
              : ''}
          </Typography.Text>
        </div>
      ))}
    </Space>
  );
}

/**
 * @sunxu-component mes-specific
 * @sunxu-domain finance
 * @sunxu-reason Keeps MES price-control precheck and exception flow in the UI suite while permissions, requests, and errors remain host supplied.
 * Displays the authoritative server decision before confirmation or sending.
 */
export function PriceControlPrecheckButton({
  domain,
  sourceType,
  sourceId,
  partyType,
  partyId,
  partyLevel,
  asOfDate,
  buildLines,
  permission,
  visible,
  onConfirm,
  successMessage,
  onSuccess,
  children,
  buttonType = 'primary',
  icon,
  disabled,
  loading,
  confirmTitle,
  confirmContent,
  beforeCheck,
  autoRun = false,
  autoRunToken,
}: PriceControlPrecheckButtonProps) {
  const { message, modal } = App.useApp();
  const capabilities = useMesPriceControlCapabilities();
  const [checking, setChecking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [result, setResult] = useState<PriceControlPrecheckResult | null>(null);
  const autoRunRef = useRef(false);

  useEffect(() => {
    autoRunRef.current = false;
  }, [autoRunToken]);

  const runConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await onConfirm();
      if (successMessage) message.success(successMessage);
      setModalOpen(false);
      onSuccess?.();
    } catch (error) {
      modal.error({
        title: '操作未完成',
        content:
          capabilities?.getErrorMessage(error) ??
          (error instanceof Error ? error.message : '操作失败'),
      });
    } finally {
      setConfirming(false);
    }
  }, [capabilities, message, modal, onConfirm, onSuccess, successMessage]);

  // 价格预检使用原始权限码；隐藏价格管理入口的运营特性不应绕过后端规则。
  const canPrecheck = capabilities?.hasRawViewPermission() ?? false;

  const confirmThenRun = useCallback(async () => {
    if (!confirmTitle) {
      await runConfirm();
      return;
    }
    modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      onOk: () => runConfirm(),
    });
  }, [confirmContent, confirmTitle, modal, runConfirm]);

  const handleClick = useCallback(async () => {
    if (beforeCheck && !beforeCheck()) return;

    const rawLines = buildLines();
    const lines = rawLines
      .filter(
        (line) =>
          !!line.materialId &&
          typeof line.unitPrice === 'number' &&
          Number.isFinite(line.unitPrice),
      )
      .map((line) => filterNullish(line));

    if (!canPrecheck || lines.length === 0 || !capabilities) {
      await confirmThenRun();
      return;
    }

    setChecking(true);
    try {
      const precheck = await capabilities.precheck(
        filterNullish({
          domain,
          sourceType,
          sourceId,
          partyId,
          partyLevel,
          asOfDate,
          lines,
        }) as PriceControlPrecheckRequest,
      );
      const hasIssues =
        precheck.warnings.length > 0 ||
        precheck.blockers.length > 0 ||
        precheck.approvalRequired.length > 0;
      if (!hasIssues) {
        await confirmThenRun();
        return;
      }
      setResult(precheck);
      setModalOpen(true);
    } finally {
      setChecking(false);
    }
  }, [
    asOfDate,
    beforeCheck,
    buildLines,
    canPrecheck,
    capabilities,
    confirmThenRun,
    domain,
    partyId,
    partyLevel,
    sourceId,
    sourceType,
  ]);

  useEffect(() => {
    if (!autoRun || autoRunRef.current) return;
    autoRunRef.current = true;
    void handleClick();
  }, [autoRun, handleClick]);

  const handleRequestApproval = useCallback(
    async (decision: PriceControlDecision) => {
      if (!capabilities) return;
      setRequestingApproval(true);
      try {
        await capabilities.requestExceptionApproval(
          filterNullish({
            domain,
            sourceType,
            sourceId,
            sourceItemId: decision.sourceItemId,
            materialId: decision.materialId,
            partyType,
            partyId,
            ruleId: decision.ruleId,
            enteredUnitPrice: decision.enteredUnitPrice ?? 0,
            controlUnitPrice: decision.controlUnitPrice,
            estimatedCost: decision.estimatedCost,
            grossMarginRate: decision.grossMarginRate,
            reason: `价格控制预检命中：${decision.message}`,
          }),
        );
        message.success('价格例外申请已提交，等待审批');
      } finally {
        setRequestingApproval(false);
      }
    },
    [capabilities, domain, message, partyId, partyType, sourceId, sourceType],
  );

  const blockers = result?.blockers ?? [];
  const warnings = result?.warnings ?? [];
  const approvalRequired = result?.approvalRequired ?? [];
  const hasBlocker = blockers.length > 0;
  const hasApproval = approvalRequired.length > 0;

  return (
    <>
      <PermissionButton
        permission={permission}
        visible={visible}
        type={buttonType}
        icon={icon}
        disabled={disabled}
        loading={checking || !!loading}
        onClick={() => void handleClick()}
      >
        {children}
      </PermissionButton>
      <Modal
        title="价格控制预检"
        open={modalOpen}
        width={620}
        onCancel={() => setModalOpen(false)}
        maskClosable={false}
        footer={
          <Space>
            <Button onClick={() => setModalOpen(false)}>返回修改</Button>
            <Button
              type="primary"
              loading={confirming}
              disabled={hasBlocker || hasApproval}
              onClick={() => void runConfirm()}
            >
              {hasBlocker
                ? '存在阻断项，无法确认'
                : hasApproval
                  ? '需先完成价格例外审批'
                  : '仍然确认'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {hasBlocker ? (
            <Alert
              type="error"
              showIcon
              message="以下价格被规则阻断，确认会被后端拒绝，请调整单价或维护价格控制规则"
              description={<DecisionList decisions={blockers} />}
            />
          ) : null}
          {hasApproval ? (
            <Alert
              type="warning"
              showIcon
              message="以下价格需要价格例外审批"
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <DecisionList decisions={approvalRequired} />
                  <Space wrap>
                    {approvalRequired.map((decision, index) => (
                      <Button
                        key={`${decision.ruleId}-${decision.sourceItemId ?? index}`}
                        size="small"
                        loading={requestingApproval}
                        onClick={() => void handleRequestApproval(decision)}
                      >
                        申请例外（{decision.ruleName}）
                      </Button>
                    ))}
                  </Space>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    申请提交后需走审批流，审批通过后方可确认本单据。
                  </Typography.Text>
                </Space>
              }
            />
          ) : null}
          {warnings.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="以下价格触发提醒（不阻断确认）"
              description={<DecisionList decisions={warnings} />}
            />
          ) : null}
        </Space>
      </Modal>
    </>
  );
}
