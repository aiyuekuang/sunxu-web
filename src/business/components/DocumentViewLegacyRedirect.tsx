import { Empty } from 'antd';
import { useEffect } from 'react';
import { useMesActionIntentRoute } from '../MesUiProvider';

export type DocumentViewLegacyRedirectProps = {
  description: string;
  legacyPath: string;
  storageKey: string;
  targetPath: string;
};

function writeDetailViewPreference(storageKey: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, 'detail');
  } catch {
    // Storage restrictions must not prevent the legacy route from redirecting.
  }
}

/**
 * @sunxu-layer business
 * @sunxu-domain document-ledger
 * @sunxu-reason Preserves MES legacy ledger link semantics while the host supplies the current route, query, preference update, and navigation.
 * Redirect old detail ledger links while retaining their search query.
 */
export function DocumentViewLegacyRedirect({
  description,
  legacyPath,
  storageKey,
  targetPath,
}: DocumentViewLegacyRedirectProps) {
  const route = useMesActionIntentRoute();

  useEffect(() => {
    if (!route || route.pathname.replace(/\/+$/, '') !== legacyPath) return;

    writeDetailViewPreference(storageKey);
    route.replace(`${targetPath}${route.search}`);
  }, [legacyPath, route, storageKey, targetPath]);

  return <Empty description={description} />;
}
