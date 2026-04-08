export type ReportFilterMode = "dia" | "mes" | "anio";
export type SalesChannel = "Domicilio" | "Local";

export interface ReportSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReportSale {
  id: string;
  customer: string;
  channel: SalesChannel;
  payment: string;
  createdAt: string;
  items: ReportSaleItem[];
  total: number;
}

export interface ProductMetric {
  name: string;
  quantity: number;
  percentage: number;
  note: string;
}

export interface ProductBarMetric {
  name: string;
  quantity: number;
  percentage: number;
}
