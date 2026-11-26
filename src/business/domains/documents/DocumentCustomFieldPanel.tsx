import React, { useCallback, useState, type ReactNode } from 'react';
import {
  useCustomFieldPanelRenderer,
  type CustomFieldDisplayState,
} from '../../providers/BusinessUiProvider';

export interface DocumentCustomFieldPanelProps {
  objectType: string;
  objectId?: string;
  editable?: boolean;
  /** Expanded rows or nonstandard detail containers may provide a local heading. */
  title?: ReactNode;
}

/**
 * @sunxu-reason Keeps document custom fields adjacent to ordinary details only when they contain fields or an error.
 * The host supplies schema, data requests, and the field editor through BusinessUiProvider.
 */
/**
 * @sunxu-layer business
 * @sunxu-domain documents
 * @sunxu-reason Presents reusable document custom field panel behavior consistently while the host supplies data, access decisions, and business side effects.
 */
export function DocumentCustomFieldPanel({
  objectType,
  objectId,
  editable = false,
  title,
}: DocumentCustomFieldPanelProps) {
  const renderCustomFieldPanel = useCustomFieldPanelRenderer();
  const identity = `${objectType}:${objectId ?? ''}`;
  const [displayState, setDisplayState] = useState<{
    identity: string;
    state: CustomFieldDisplayState;
  }>({
    identity,
    state: {
      loading: Boolean(objectId),
      hasFields: false,
      hasError: false,
    },
  });

  const handleDisplayStateChange = useCallback(
    (nextState: CustomFieldDisplayState) =>
      setDisplayState({ identity, state: nextState }),
    [identity],
  );

  if (!objectId || !renderCustomFieldPanel) return null;

  // Hide the previous object's fields until the host reports the new object's state.
  const currentDisplayState =
    displayState.identity === identity
      ? displayState.state
      : { loading: Boolean(objectId), hasFields: false, hasError: false };
  const visible = currentDisplayState.hasFields || currentDisplayState.hasError;

  return (
    <div
      className="sxw-document-custom-field-panel"
      hidden={!visible}
      aria-hidden={!visible}
    >
      {title ? (
        <div className="sxw-document-custom-field-panel__title">{title}</div>
      ) : null}
      <React.Fragment key={identity}>
        {renderCustomFieldPanel({
          objectType,
          objectId,
          editable,
          showEmpty: false,
          onDisplayStateChange: handleDisplayStateChange,
        })}
      </React.Fragment>
    </div>
  );
}
