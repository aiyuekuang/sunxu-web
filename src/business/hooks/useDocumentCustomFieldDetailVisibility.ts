import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useCustomFieldFormCapabilities } from '../providers/BusinessUiProvider';
import type { CustomFieldSchema } from '../domains/documents/custom-field-form-types';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasDetailFields(schema: CustomFieldSchema | null) {
  return (schema?.fields ?? []).some(
    (field) =>
      field.isActive !== false &&
      readObject(field.displayJson).showInDetail === true,
  );
}

/**
 * Hide document-row expand controls until the host schema confirms detail fields exist.
 * Schema loading and errors remain host API owned; request races are isolated on unmount/change.
 */
export function useDocumentCustomFieldDetailVisibility(
  objectType?: string,
  enabled = true,
) {
  const capabilities = useCustomFieldFormCapabilities();
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
