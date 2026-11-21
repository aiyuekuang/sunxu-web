export interface MesPurchaseReceiptCapabilities {
  /** Generate a rule-based system batch number for a purchase receipt material. */
  generateSystemBatchNo: (params: {
    materialId: string;
  }) => Promise<{ batchNo?: string | null } | null | undefined>;
}
