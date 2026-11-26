import React, { type ReactNode } from 'react';
import { useMesLabelLayoutCapabilities } from '../MesUiProvider';
import type { LabelOrientation } from './print-layout-types';

export interface LabelLayoutProps {
  children: ReactNode;
  /** Optional per-render override; otherwise the host's saved label size is used. */
  orientation?: LabelOrientation;
}

/**
 * @sunxu-layer business
 * @sunxu-domain print-layout
 * @sunxu-reason Preserves the label print root while taking saved paper orientation from the MES host.
 * Small-paper label print layout.
 */
export const LabelLayout = React.forwardRef<HTMLDivElement, LabelLayoutProps>(
  function LabelLayout({ children, orientation: orientationOverride }, ref) {
    const labelCapabilities = useMesLabelLayoutCapabilities();
    const orientation =
      orientationOverride ?? labelCapabilities?.getOrientation() ?? 'horizontal';

    return (
      <div ref={ref} className={`label-root ${orientation}`}>
        {children}
      </div>
    );
  },
);
