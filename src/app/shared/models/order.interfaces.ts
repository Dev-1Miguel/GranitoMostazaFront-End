import { CartItem } from "./product.interfaces";

export type OrderStatus = "Pendiente" | "En preparacion" | "Listo" | "Entregado";
export type OrderChannel = "Web" | "WhatsApp" | "Salon" | "Domicilio" | "Local";

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutPayload {
  customer: CheckoutCustomer;
  channel: OrderChannel;
  payment: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

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

export interface OrderReceipt {
  id: string;
  status: OrderStatus;
  customer: string;
  total: number;
  totalFormatted: string;
  createdAt: string;
  payment: string;
  channel: OrderChannel;
  notes: string;
  items: CartItem[];
}
