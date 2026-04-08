import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map } from "rxjs";
import { Product } from "../../../shared/models/product.interfaces";
import { OrderItem, OrderStatus, OrderSummary } from "../../../shared/models/order.interfaces";
import { MenuDataService } from "../../menu/menu-data.service";
import { buildApiUrl } from "../../../core/config/api-url.util";

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly menuDataService = inject(MenuDataService);
  private readonly ordersUrl = buildApiUrl("/admin/orders");

  getOrders(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(this.ordersUrl).pipe(
      catchError(() =>
        this.menuDataService.getMenuData().pipe(
          map((data) => this.buildOrders([...data.postres, ...data.desayunos, ...data.bebidas]))
        )
      )
    );
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderItem> {
    return this.http.patch<OrderItem>(`${this.ordersUrl}/${encodeURIComponent(orderId)}/status`, {
      status,
    });
  }

  buildSummary(orders: OrderItem[]): OrderSummary[] {
    return [
      { label: "Pendientes", value: orders.filter((order) => order.status === "Pendiente").length },
      { label: "En preparacion", value: orders.filter((order) => order.status === "En preparacion").length },
      { label: "Listos", value: orders.filter((order) => order.status === "Listo").length },
      { label: "Entregados", value: orders.filter((order) => order.status === "Entregado").length },
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
}
