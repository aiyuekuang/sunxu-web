export interface MaterialPriceUpdateRequest {
  id: string;
  unitCost?: number;
  referenceSalePrice?: number;
}

export interface MaterialPriceSectionProps {
  materialId: string;
  unitCost?: number | null;
  referenceSalePrice?: number | null;
  minSalePrice?: number | null;
  maxPurchasePrice?: number | null;
  boundsCurrency?: string | null;
  /** 库存移动加权平均成本（只读，若有）。 */
  averageCost?: number | null;
  /** host 物料更新权限结果，由宿主计算。 */
  canEditMaterial: boolean;
  /** host 价格控制查看权限结果，由宿主计算。 */
  canViewBounds: boolean;
  /** 更新物料参考价的宿主服务。 */
  updateMaterialPrice: (params: MaterialPriceUpdateRequest) => Promise<unknown>;
  /** 使用宿主路由打开价格管理页。 */
  navigate: (path: string) => void;
  onSaved: () => void;
}
