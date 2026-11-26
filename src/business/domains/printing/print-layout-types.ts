export type LabelOrientation = 'horizontal' | 'vertical';

/** The host owns label size preferences and reports the current orientation. */
export interface LabelLayoutCapabilities {
  getOrientation: () => LabelOrientation;
}
