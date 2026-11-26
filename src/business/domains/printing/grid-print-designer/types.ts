import type { ReactNode } from 'react';
import type { GridPrintTemplateSchema } from './schema';

/** Template modes supported by the host grid designer. */
export type GridDesignerTemplateType = 'document_flow' | 'continuous_fixed';

/**
 * Structural print field descriptor supplied by the host.
 * The host is responsible for permission filtering before returning fields.
 */
export interface GridDesignerField {
  businessType: string;
  fieldPath: string;
  fieldLabel: string;
  fieldType: string;
  groupName: string;
  isArray: boolean;
  formatType?: string | null;
  sampleValue?: string | number | boolean;
  requiredInTemplate: boolean;
  visible: boolean;
  requiredAnyPermissions?: string[];
}

/** Paper dimensions and margins used only for the printable-width guide. */
export interface GridDesignerPaperProfile {
  name: string;
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
  marginTopMm?: number | null;
  marginRightMm?: number | null;
  marginBottomMm?: number | null;
  marginLeftMm?: number | null;
}

export interface GridPrintDesignerDataRequest {
  businessType: string;
  templateType: GridDesignerTemplateType;
}

/** host-owned field and sample-data requests injected by the host. */
export interface GridPrintDesignerDataSource {
  loadFields: (
    request: GridPrintDesignerDataRequest,
  ) => Promise<GridDesignerField[]>;
  loadSampleData: (request: { businessType: string }) => Promise<unknown>;
  onLoadError?: (
    error: unknown,
    request: GridPrintDesignerDataRequest,
  ) => void;
}

export interface GridPreviewFeedback {
  error: (content: ReactNode) => void;
}

/**
 * GridPrintDesigner keeps editing and schema generation local. The host
 * injects authorized field metadata, sample data, current paper metrics, and
 * the draft preview action.
 */
export interface GridPrintDesignerProps {
  value?: GridPrintTemplateSchema;
  onChange?: (value: GridPrintTemplateSchema) => void;
  businessName?: string;
  businessType?: string;
  templateType?: GridDesignerTemplateType;
  paperProfile?: GridDesignerPaperProfile;
  dataSource?: GridPrintDesignerDataSource;
  onPreview?: (feedback: GridPreviewFeedback) => void | Promise<void>;
  previewLoading?: boolean;
}
