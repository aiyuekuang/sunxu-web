import { useEffect, useRef } from 'react';
import { useMesActionIntentRoute } from '../MesUiProvider';

export interface DocumentActionIntentProps {
  action: string;
  enabled: boolean;
  onTrigger: () => void | Promise<void>;
}

/**
 * @sunxu-reason Replays a document action deep link through the detail screen's existing action flow.
 * The host supplies the current route and replace operation; document state stays host-authoritative.
 */
export function DocumentActionIntent({
  action,
  enabled,
  onTrigger,
}: DocumentActionIntentProps) {
  const route = useMesActionIntentRoute();
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
