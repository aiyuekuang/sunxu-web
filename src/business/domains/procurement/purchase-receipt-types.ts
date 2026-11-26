export interface PurchaseReceiptCapabilities {
  /** Generate a rule-based system batch number for a purchase receipt material. */
  generateSystemBatchNo: (params: {
    materialId: string;
  }) => Promise<{ batchNo?: string | null } | null | undefined>;
}
