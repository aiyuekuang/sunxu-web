import React, { useCallback, useState, type ReactNode } from 'react';
import {
  useMesCustomFieldPanelRenderer,
  type MesCustomFieldDisplayState,
} from '../MesUiProvider';

export interface DocumentCustomFieldPanelProps {
  objectType: string;
  objectId?: string;
  editable?: boolean;
  /** Expanded rows or nonstandard detail containers may provide a local heading. */
  title?: ReactNode;
}

/**
 * @sunxu-reason Keeps document custom fields adjacent to ordinary details only when they contain fields or an error.
 * The MES host supplies schema, data requests, and the field editor through MesUiProvider.
 */
export function DocumentCustomFieldPanel({
  objectType,
  objectId,
  editable = false,
  title,
}: DocumentCustomFieldPanelProps) {
  const renderCustomFieldPanel = useMesCustomFieldPanelRenderer();
  const identity = `${objectType}:${objectId ?? ''}`;
  const [displayState, setDisplayState] = useState<{
    identity: string;
    state: MesCustomFieldDisplayState;
  }>({
    identity,
    state: {
      loading: Boolean(objectId),
      hasFields: false,
      hasError: false,
    },
  });

  const handleDisplayStateChange = useCallback(
    (nextState: MesCustomFieldDisplayState) =>
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
      className="mes-document-custom-field-panel"
      hidden={!visible}
      aria-hidden={!visible}
    >
      {title ? (
        <div className="mes-document-custom-field-panel__title">{title}</div>
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
