export interface TemplatePrintField {
  fieldPath: string;
  fieldLabel: string;
  groupName: string;
  businessType?: string | null;
  visible: boolean;
  isArray: boolean;
  requiredInTemplate: boolean;
}

export interface TemplateCodeFieldOption {
  label: string;
  value: string;
}

export interface TemplateFieldSelectorCapabilities {
  loadFields: (params: {
    businessType: string;
    templateType: string;
  }) => Promise<TemplatePrintField[]>;
  templateTypeValues: {
    compactLabel: string;
    serialLabel: string;
    documentFlow: string;
  };
  businessTypeValues: {
    workOrder: string;
  };
  fieldPathValues: {
    barcode: string;
    serialBarcode: string;
    serialNumber: string;
  };
  preferredFieldPaths: readonly string[];
  defaultSelectionLimits: {
    compactLabel: number;
    workOrder: number;
    other: number;
  };
  isCodeLayout: (
    templateType?: string,
    layoutPreset?: string,
  ) => boolean;
}

export type TemplateLayoutThumbnail =
  | 'label-qr-right'
  | 'label-qr-top'
  | 'label-barcode-bottom'
  | 'label-text-only'
  | 'document-compact-table'
  | 'document-report-summary'
  | 'document-header-qr-table'
  | 'continuous-three-copy'
  | 'continuous-delivery-stub'
  | 'continuous-warehouse-handover'
  | 'document-standard-table'
  | 'continuous-compact-single';

export interface TemplateLayoutPresetOption {
  value: string;
  label: string;
  description: string;
  /** Host maps each preset value to one of the preserved SVG diagram variants. */
  thumbnail: TemplateLayoutThumbnail;
}
