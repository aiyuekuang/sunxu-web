import { useEffect, useRef } from 'react';
import { useActionIntentRoute } from '../../providers/BusinessUiProvider';

export interface DocumentActionIntentProps {
  action: string;
  enabled: boolean;
  onTrigger: () => void | Promise<void>;
}

/**
 * @sunxu-reason Replays a document action deep link through the detail screen's existing action flow.
 * The host supplies the current route and replace operation; document state stays host-authoritative.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document action intent behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DocumentActionIntent({
  action,
  enabled,
  onTrigger,
}: DocumentActionIntentProps) {
  const route = useActionIntentRoute();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!route || handledRef.current || !enabled) return;
    const requestedAction = new URLSearchParams(route.search).get('action');
    if (requestedAction !== action) return;

    handledRef.current = true;
    route.replace(route.pathname);
    void onTrigger();
  }, [action, enabled, onTrigger, route]);

  return null;
}
