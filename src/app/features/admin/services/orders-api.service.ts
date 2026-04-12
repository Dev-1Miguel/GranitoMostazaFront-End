import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of, tap } from "rxjs";
import { Product, CartItem } from "../../../shared/models/product.interfaces";
import {
  CheckoutPayload,
  OrderChannel,
  OrderItem,
  OrderReceipt,
  OrderStatus,
  OrderSummary,
} from "../../../shared/models/order.interfaces";
import { MenuDataService } from "../../menu/menu-data.service";
import { buildApiUrl } from "../../../core/config/api-url.util";

interface OrderApiLine {
  productoId?: number;
  productId?: number;
  productoNombre?: string;
  productName?: string;
  cantidad?: number;
  quantity?: number;
  precioUnitario?: number;
  unitPrice?: number;
}

interface OrderApiModel {
  id?: string | number;
  codigo?: string;
  numero?: string | number;
  cliente?: string;
  customer?: string;
  canal?: string;
  channel?: string;
  estado?: string;
  status?: string;
  total?: number | string;
  hora?: string;
  time?: string;
  observaciones?: string;
  notes?: string;
  pago?: string;
  payment?: string;
  resumen?: string;
  summary?: string;
  creadoEn?: string;
  createdAt?: string;
  items?: OrderApiLine[];
  detalles?: OrderApiLine[];
}

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly menuDataService = inject(MenuDataService);
  private readonly ordersUrl = buildApiUrl("/admin/orders");
  private readonly checkoutUrl = buildApiUrl("/orders");
  private readonly localOrdersKey = "gm-local-orders";

  getOrders(): Observable<OrderItem[]> {
    return this.http.get<OrderApiModel[] | { data?: OrderApiModel[] }>(this.ordersUrl).pipe(
      map((response) => this.normalizeOrderList(response)),
      tap((orders) => this.persistOrders(orders)),
      catchError(() =>
        this.menuDataService
          .getMenuData()
          .pipe(
            map((data) => this.buildOrders([...data.postres, ...data.desayunos, ...data.bebidas])),
            map((orders) => this.mergeLocalOrders(orders))
          )
      )
    );
  }

  createOrder(payload: CheckoutPayload): Observable<OrderReceipt> {
    const requestBody = this.mapCheckoutPayload(payload);
    const localReceipt = this.createLocalReceipt(payload);

    return this.http.post<OrderApiModel | { data?: OrderApiModel }>(this.checkoutUrl, requestBody).pipe(
      map((response) => this.normalizeReceipt(response)),
      catchError(() => {
        this.upsertLocalOrder(this.mapReceiptToOrderItem(localReceipt));
        return of(localReceipt);
      })
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderItem> {
    return this.http
      .patch<OrderApiModel>(`${this.ordersUrl}/${encodeURIComponent(orderId)}/status`, {
        status,
      })
      .pipe(
        map((response) => this.normalizeOrder(response)),
        tap((order) => this.upsertLocalOrder(order)),
        catchError(() => {
          const localOrder = this.getStoredOrders().find((order) => order.id === orderId);

          if (localOrder) {
            const updatedOrder = { ...localOrder, status };
            this.upsertLocalOrder(updatedOrder);
            return of(updatedOrder);
          }

          throw new Error("No se pudo actualizar el pedido.");
        })
      );
  }

  buildSummary(orders: OrderItem[]): OrderSummary[] {
    return [
      { label: "Pendientes", value: orders.filter((order) => order.status === "Pendiente").length },
      { label: "En preparacion", value: orders.filter((order) => order.status === "En preparacion").length },
      { label: "Listos", value: orders.filter((order) => order.status === "Listo").length },
      { label: "Entregados", value: orders.filter((order) => order.status === "Entregado").length },
    ];
  }

  buildDashboardStats(orders: OrderItem[]): Array<{ label: string; value: string; trend: string }> {
    const revenue = orders.reduce((sum, order) => sum + this.parseCurrency(order.total), 0);
    const average = orders.length ? revenue / orders.length : 0;
    const ready = orders.filter((order) => order.status === "Listo").length;

    return [
      {
        label: "Pedidos del dia",
        value: `${orders.length}`,
        trend: `${orders.filter((order) => order.status === "Pendiente").length} pendientes y ${ready} listos`,
      },
      {
        label: "Ingresos visibles",
        value: this.formatCurrency(revenue),
        trend: "Total estimado segun los pedidos cargados en el panel",
      },
      {
        label: "Ticket promedio",
        value: this.formatCurrency(average),
        trend: "Referencia rapida para operacion diaria",
      },
    ];
  }

  private buildOrders(products: Product[]): OrderItem[] {
    const getProduct = (index: number): Product => products[index] ?? products[0];
    const makeTotal = (selected: Product[]) =>
      `$${selected.reduce((sum, product) => sum + product.price, 0).toFixed(2)}`;

    const combinations = [
      [getProduct(5), getProduct(33)],
      [getProduct(21), getProduct(8)],
      [getProduct(4), getProduct(34)],
      [getProduct(26), getProduct(39)],
      [getProduct(1), getProduct(42)],
    ];

    return [
      {
        id: "#381",
        customer: "Ana Paredes",
        channel: "Web",
        summary: `${combinations[0][0].name}, ${combinations[0][1].name}`,
        total: makeTotal(combinations[0]),
        time: "08:14",
        status: "Pendiente",
        notes: "Retirar en local",
        payment: "Transferencia",
      },
      {
        id: "#382",
        customer: "Mesa 04",
        channel: "Salon",
        summary: `${combinations[1][0].name}, ${combinations[1][1].name}`,
        total: makeTotal(combinations[1]),
        time: "08:19",
        status: "En preparacion",
        notes: "Servir juntos",
        payment: "Efectivo",
      },
      {
        id: "#383",
        customer: "Luis Vera",
        channel: "WhatsApp",
        summary: `${combinations[2][0].name}, ${combinations[2][1].name}`,
        total: makeTotal(combinations[2]),
        time: "08:27",
        status: "Listo",
        notes: "Delivery por retirar",
        payment: "Pago movil",
      },
      {
        id: "#384",
        customer: "Mesa 02",
        channel: "Salon",
        summary: `${combinations[3][0].name}, ${combinations[3][1].name}`,
        total: makeTotal(combinations[3]),
        time: "08:33",
        status: "En preparacion",
        notes: "Sin azucar en la bebida",
        payment: "Efectivo",
      },
      {
        id: "#385",
        customer: "Marta Leon",
        channel: "Web",
        summary: `${combinations[4][0].name}, ${combinations[4][1].name}`,
        total: makeTotal(combinations[4]),
        time: "08:40",
        status: "Pendiente",
        notes: "Agregar cubiertos",
        payment: "Tarjeta",
      },
    ];
  }

  private normalizeOrderList(response: OrderApiModel[] | { data?: OrderApiModel[] }): OrderItem[] {
    const records = Array.isArray(response) ? response : response.data ?? [];
    const normalized = records.map((record) => this.normalizeOrder(record));

    return this.mergeLocalOrders(normalized);
  }

  private normalizeOrder(order: OrderApiModel): OrderItem {
    const id = this.stringifyValue(order.id ?? order.codigo ?? order.numero ?? `#${Date.now()}`);
    const customer = this.stringifyValue(order.customer ?? order.cliente ?? "Cliente");
    const channel = this.normalizeChannel(order.channel ?? order.canal);
    const payment = this.stringifyValue(order.payment ?? order.pago ?? "Por definir");
    const status = this.normalizeStatus(order.status ?? order.estado);
    const rawItems = order.items ?? order.detalles ?? [];
    const createdAt = this.stringifyValue(order.createdAt ?? order.creadoEn ?? "");
    const summary = this.stringifyValue(order.summary ?? order.resumen ?? this.buildSummaryFromLines(rawItems));
    const totalNumber = this.parseCurrency(order.total);

    return {
      id: id.startsWith("#") ? id : `#${id}`,
      customer,
      channel,
      summary,
      total: this.formatCurrency(totalNumber),
      time: this.extractTime(createdAt) || this.stringifyValue(order.time ?? order.hora ?? "--:--"),
      status,
      notes: this.stringifyValue(order.notes ?? order.observaciones ?? "Sin observaciones"),
      payment,
    };
  }

  private normalizeReceipt(response: OrderApiModel | { data?: OrderApiModel }): OrderReceipt {
    const order = this.extractOrderModel(response);
    const normalizedOrder = this.normalizeOrder(order);
    const createdAt = this.stringifyValue(order.createdAt ?? order.creadoEn ?? new Date().toISOString());
    const totalValue = this.parseCurrency(order.total);

    return {
      id: normalizedOrder.id,
      status: normalizedOrder.status,
      customer: normalizedOrder.customer,
      total: totalValue,
      totalFormatted: this.formatCurrency(totalValue),
      createdAt,
      payment: normalizedOrder.payment,
      channel: this.normalizeChannel(order.channel ?? order.canal),
      notes: normalizedOrder.notes,
      items: this.mapApiLinesToCartItems(order.items ?? order.detalles ?? []),
    };
  }

  private mapCheckoutPayload(payload: CheckoutPayload): Record<string, unknown> {
    return {
      cliente: payload.customer.name,
      correo: payload.customer.email,
      telefono: payload.customer.phone,
      canal: payload.channel,
      pago: payload.payment,
      observaciones: payload.notes,
      subtotal: payload.subtotal,
      envio: payload.shipping,
      impuesto: payload.tax,
      total: payload.total,
      items: payload.items.map((item) => ({
        productoId: item.id,
        nombre: item.name,
        cantidad: item.quantity,
        precioUnitario: item.price,
        subtotal: item.price * item.quantity,
      })),
    };
  }

  private createLocalReceipt(payload: CheckoutPayload): OrderReceipt {
    const id = `#L${Date.now().toString().slice(-6)}`;
    const createdAt = new Date().toISOString();

    return {
      id,
      status: "Pendiente",
      customer: payload.customer.name,
      total: payload.total,
      totalFormatted: this.formatCurrency(payload.total),
      createdAt,
      payment: payload.payment,
      channel: payload.channel,
      notes: payload.notes || "Sin observaciones",
      items: payload.items,
    };
  }

  private mapReceiptToOrderItem(receipt: OrderReceipt): OrderItem {
    return {
      id: receipt.id,
      customer: receipt.customer,
      channel: receipt.channel,
      summary: receipt.items.map((item) => `${item.quantity}x ${item.name}`).join(", "),
      total: receipt.totalFormatted,
      time: this.extractTime(receipt.createdAt) || "--:--",
      status: receipt.status,
      notes: receipt.notes,
      payment: receipt.payment,
    };
  }

  private mapApiLinesToCartItems(lines: OrderApiLine[]): CartItem[] {
    return lines.map((line, index) => {
      const price = Number(line.unitPrice ?? line.precioUnitario ?? 0);
      const quantity = Number(line.quantity ?? line.cantidad ?? 1);

      return {
        id: Number(line.productId ?? line.productoId ?? index + 1),
        name: this.stringifyValue(line.productName ?? line.productoNombre ?? "Producto"),
        description: "",
        image: "",
        price,
        quantity,
      };
    });
  }

  private buildSummaryFromLines(lines: OrderApiLine[]): string {
    return lines
      .map((line) => {
        const quantity = Number(line.quantity ?? line.cantidad ?? 1);
        const name = this.stringifyValue(line.productName ?? line.productoNombre ?? "Producto");
        return `${quantity}x ${name}`;
      })
      .join(", ");
  }

  private normalizeStatus(status: unknown): OrderStatus {
    const normalized = this.stringifyValue(status).toLowerCase();

    if (normalized.includes("prepar")) return "En preparacion";
    if (normalized.includes("list")) return "Listo";
    if (normalized.includes("entreg")) return "Entregado";
    return "Pendiente";
  }

  private normalizeChannel(channel: unknown): OrderChannel {
    const normalized = this.stringifyValue(channel).toLowerCase();

    if (normalized.includes("whats")) return "WhatsApp";
    if (normalized.includes("sal")) return "Salon";
    if (normalized.includes("dom")) return "Domicilio";
    if (normalized.includes("loc")) return "Local";
    return "Web";
  }

  private extractOrderModel(response: OrderApiModel | { data?: OrderApiModel }): OrderApiModel {
    return "data" in response && response.data ? response.data : (response as OrderApiModel);
  }

  private parseCurrency(value: unknown): number {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = Number(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(normalized) ? normalized : 0;
    }

    return 0;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  private extractTime(value: string): string {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  private stringifyValue(value: unknown): string {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }

  private mergeLocalOrders(baseOrders: OrderItem[]): OrderItem[] {
    const merged = new Map(baseOrders.map((order) => [order.id, order]));

    for (const order of this.getStoredOrders()) {
      merged.set(order.id, order);
    }

    return [...merged.values()].sort((a, b) => b.id.localeCompare(a.id));
  }

  private upsertLocalOrder(order: OrderItem): void {
    const orders = this.getStoredOrders();
    const nextOrders = [...orders.filter((item) => item.id !== order.id), order];
    this.persistOrders(nextOrders);
  }

  private persistOrders(orders: OrderItem[]): void {
    if (typeof localStorage === "undefined") {
      return;
    }

    localStorage.setItem(this.localOrdersKey, JSON.stringify(orders));
  }

  private getStoredOrders(): OrderItem[] {
    if (typeof localStorage === "undefined") {
      return [];
    }

    const serialized = localStorage.getItem(this.localOrdersKey);

    if (!serialized) {
      return [];
    }

    try {
      return JSON.parse(serialized) as OrderItem[];
    } catch {
      return [];
    }
  }
}
