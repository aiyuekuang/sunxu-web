import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useMesCustomFieldFormCapabilities } from '../MesUiProvider';
import type { MesCustomFieldSchema } from '../components/custom-field-form-types';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasDetailFields(schema: MesCustomFieldSchema | null) {
  return (schema?.fields ?? []).some(
    (field) =>
      field.isActive !== false &&
      readObject(field.displayJson).showInDetail === true,
  );
}

/**
 * Hide document-row expand controls until the MES schema confirms detail fields exist.
 * Schema loading and errors remain host API owned; request races are isolated on unmount/change.
 */
export function useDocumentCustomFieldDetailVisibility(
  objectType?: string,
  enabled = true,
) {
  const capabilities = useMesCustomFieldFormCapabilities();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !objectType) {
      setVisible(false);
      return undefined;
    }
    if (!capabilities) {
      setVisible(false);
      return undefined;
    }

    let cancelled = false;
    setVisible(false);
    capabilities
      .requestFormSchema({ objectType })
      .then((schema) => {
        if (!cancelled) setVisible(hasDetailFields(schema ?? null));
      })
      .catch(() => {
        if (!cancelled) {
          setVisible(false);
          message.error('加载自定义字段配置失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [capabilities, enabled, message, objectType]);

  return visible;
}
