export type LabelOrientation = 'horizontal' | 'vertical';

/** The host owns label size preferences and reports the current orientation. */
export interface MesLabelLayoutCapabilities {
  getOrientation: () => LabelOrientation;
}
