export type OrderStatus = "Pendiente" | "En preparacion" | "Listo" | "Entregado";

export interface OrderSummary {
  label: string;
  value: number;
}

export interface OrderItem {
  id: string;
  customer: string;
  channel: string;
  summary: string;
  total: string;
  time: string;
  status: OrderStatus;
  notes: string;
  payment: string;
}
