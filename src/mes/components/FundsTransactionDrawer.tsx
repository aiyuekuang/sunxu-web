/** @sunxu-component mes-specific @sunxu-domain mes-funds-transactions @sunxu-reason Preserves the expense bill funds-fact detail drawer while injecting host detail loading, enum labels, date and amount formats, and error notification. */
import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type {
  FundsTransactionDetail,
  FundsTransactionDrawerProps,
} from './funds-transaction-drawer-types';

export function FundsTransactionDrawer({
  open,
  transactionId,
  onClose,
  capabilities,
}: FundsTransactionDrawerProps) {
  const [transaction, setTransaction] = useState<FundsTransactionDetail>();
  const [loading, setLoading] = useState(false);
  const capabilitiesRef = useRef(capabilities);
  capabilitiesRef.current = capabilities;
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (!open) return undefined;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    let mounted = true;
    setLoading(true);
    setTransaction(undefined);
    void (async () => {
      try {
        const detail = await capabilitiesRef.current.loadDetail({
          id: transactionId,
        });
        if (mounted && requestSeqRef.current === requestSeq) {
          setTransaction(detail);
        }
      } catch (error: unknown) {
        if (mounted && requestSeqRef.current === requestSeq) {
          capabilitiesRef.current.notifyLoadError(error);
        }
      } finally {
        if (mounted && requestSeqRef.current === requestSeq) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, transactionId]);

  return (
    <Drawer
      size="min(640px, calc(100vw - 24px))"
      title="资金流水"
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {transaction ? (
          <ProDescriptions<FundsTransactionDetail>
            column={2}
            dataSource={transaction}
            columns={[
              {
                title: '流水单号',
                render: () => transaction.transactionNo,
              },
              {
                title: '记账状态',
                render: () =>
                  capabilities.statusLabel(transaction.status) ??
                  transaction.status,
              },
              {
                title: '资金账户',
                render: () => transaction.account?.name || '-',
              },
              {
                title: '收支方向',
                render: () =>
                  capabilities.directionLabel(transaction.direction) ??
                  transaction.direction,
              },
              {
                title: '金额',
                render: () => (
                  <>
                    {capabilities.formatAmount(transaction.amount)}
                    {transaction.currency}
                  </>
                ),
              },
              {
                title: '业务日期',
                render: () => capabilities.formatDate(transaction.bizDate),
              },
              {
                title: '往来对象',
                render: () => transaction.counterpartyName || '-',
              },
              {
                title: '来源单号',
                render: () => transaction.sourceNo || '-',
              },
              {
                title: '记账时间',
                render: () => capabilities.formatDateTime(transaction.createdAt),
              },
              {
                title: '备注',
                span: 2,
                render: () => transaction.remark || '-',
              },
            ]}
          />
        ) : null}
      </Spin>
    </Drawer>
  );
}
