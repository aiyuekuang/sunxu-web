import { Typography } from 'antd';
import { useEffect, useState } from 'react';

export interface DefaultRouteHintCandidate {
  recommended?: boolean;
  code?: string | null;
  name?: string | null;
  versionLabel?: string | null;
  reason?: string | null;
}

export interface DefaultRouteHintRequest {
  materialId: string;
  customerId?: string;
  routeSelectionDate?: string;
}

export interface DefaultRouteHintProps {
  materialId?: string;
  routeId?: string;
  customerId?: string;
  routeSelectionDate?: string;
  /** host supplies its process-route request; errors remain silent. */
  requestCandidates: (
    params: DefaultRouteHintRequest,
  ) => Promise<{ candidates?: DefaultRouteHintCandidate[] } | null | undefined>;
}

/**
 * @sunxu-layer business
 * @sunxu-domain manufacturing
 * @sunxu-reason Presents host recommended-route candidates before production scheduling.
 * Shows the route that production scheduling will select when the user leaves
 * route selection empty. The host owns the API and any request policy.
 */
export function DefaultRouteHint({
  materialId,
  routeId,
  customerId,
  routeSelectionDate,
  requestCandidates,
}: DefaultRouteHintProps) {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!materialId || routeId) {
      setHint(null);
      return;
    }

    requestCandidates({ materialId, customerId, routeSelectionDate })
      .then((res) => {
        if (cancelled) return;
        const recommended = (res?.candidates ?? []).find(
          (item) => item.recommended,
        );
        if (!recommended) {
          setHint(
            '该物料暂无可用默认工艺路线；排产前请配置默认路线或在此手动选择',
          );
          return;
        }
        const label = [recommended.code, recommended.name]
          .filter(Boolean)
          .join(' - ');
        const version = recommended.versionLabel
          ? ` / ${recommended.versionLabel}`
          : '';
        setHint(
          `不选路线时，排产将默认使用：${label}${version}${
            recommended.reason ? `（${recommended.reason}）` : ''
          }`,
        );
      })
      .catch(() => {
        // This auxiliary hint must not interrupt the host form workflow.
        if (!cancelled) setHint(null);
      });

    return () => {
      cancelled = true;
    };
  }, [materialId, routeId, customerId, routeSelectionDate, requestCandidates]);

  if (!hint) return null;
  return (
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {hint}
    </Typography.Text>
  );
}
