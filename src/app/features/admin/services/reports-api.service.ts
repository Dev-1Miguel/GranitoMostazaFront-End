import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map } from "rxjs";
import { Product } from "../../../shared/models/product.interfaces";
import { ProductBarMetric, ProductMetric, ReportSale, ReportSaleItem, SalesChannel } from "../../../shared/models/report.interfaces";
import { MenuDataService } from "../../menu/menu-data.service";
import { buildApiUrl } from "../../../core/config/api-url.util";

@Injectable({
  providedIn: "root",
})
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly menuDataService = inject(MenuDataService);
  private readonly salesUrl = buildApiUrl("/admin/reports/sales");

  getSales(): Observable<ReportSale[]> {
    return this.http.get<ReportSale[]>(this.salesUrl).pipe(
      catchError(() =>
        this.menuDataService.getMenuData().pipe(
          map((data) => this.buildSales([...data.desayunos, ...data.postres, ...data.bebidas]))
        )
      )
    );
  }

  buildProductMetric(kind: "top" | "least", sales: ReportSale[]): ProductMetric {
    const entries = this.getProductEntries(sales);

    if (!entries.length) {
      return {
        name: "Sin datos",
        quantity: 0,
        percentage: 0,
        note: "No hay ventas en el periodo seleccionado.",
      };
    }

    const [maxName, maxQty] = entries[0];
    const [minName, minQty] = entries[entries.length - 1];

    if (kind === "top") {
      return {
        name: maxName,
        quantity: maxQty,
        percentage: 100,
        note: "Es el producto con mayor salida en el periodo filtrado.",
      };
    }

    return {
      name: minName,
      quantity: minQty,
      percentage: maxQty ? (minQty / maxQty) * 100 : 0,
      note: "Es el producto con menor movimiento dentro de las ventas visibles.",
    };
  }

  buildProductBars(kind: "top" | "least", sales: ReportSale[]): ProductBarMetric[] {
    const entries = this.getProductEntries(sales);

    if (!entries.length) {
      return [{ name: "Sin datos", quantity: 0, percentage: 0 }];
    }

    const selected =
      kind === "top"
        ? entries.slice(0, 5)
        : [...entries].reverse().slice(0, 5).sort((a, b) => a[1] - b[1]);

    const maxValue = Math.max(...selected.map(([, quantity]) => quantity), 0);

    return selected.map(([name, quantity]) => ({
      name,
      quantity,
      percentage: maxValue ? (quantity / maxValue) * 100 : 0,
    }));
  }

  private buildSales(products: Product[]): ReportSale[] {
    const now = new Date();
    const customers = [
      "Ana Paredes",
      "Carlos Solis",
      "Marta Leon",
      "Luis Vera",
      "Mesa 02",
      "Mesa 04",
      "Mesa 07",
      "Patricia Cedeño",
      "Daniela Mena",
      "Sofia Andrade",
    ];
    const payments = ["Efectivo", "Tarjeta", "Transferencia", "Pago movil"];
    const favorite = products[0] ?? products[1];
    const occasional = products[products.length - 1] ?? products[0];
    const sales: ReportSale[] = [];

    for (let index = 0; index < 180; index += 1) {
      const saleDate = new Date(now);
      const dayOffset = Math.floor(index / 2);

      saleDate.setDate(now.getDate() - dayOffset);
      saleDate.setHours(7 + (index % 10), (index * 17) % 60, 0, 0);

      const baseProduct = products[(index * 3) % products.length] ?? favorite;
      const secondProduct = products[(index * 5 + 7) % products.length] ?? baseProduct;
      const thirdProduct = products[(index * 7 + 11) % products.length] ?? secondProduct;
      const lines: ReportSaleItem[] = [];

      lines.push(this.createSaleItem(baseProduct, (index % 3) + 1));

      if (index % 2 === 0) {
        lines.push(this.createSaleItem(secondProduct, ((index + 1) % 2) + 1));
      }

      if (index % 5 === 0) {
        lines.push(this.createSaleItem(thirdProduct, 1));
      }

      if (index % 3 === 0 && favorite) {
        lines.push(this.createSaleItem(favorite, 2));
      }

      if (index % 37 === 0 && occasional) {
        lines.splice(0, lines.length, this.createSaleItem(occasional, 1));
      }

      const mergedLines = this.mergeRepeatedItems(lines);
      const total = mergedLines.reduce((sum, item) => sum + item.subtotal, 0);

      sales.push({
        id: `V-${(1000 + index).toString()}`,
        customer: customers[index % customers.length],
        channel: index % 4 === 0 || index % 4 === 1 ? "Domicilio" : "Local",
        payment: payments[index % payments.length],
        createdAt: saleDate.toISOString(),
        items: mergedLines,
        total,
      });
    }

    return sales.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  private createSaleItem(product: Product, quantity: number): ReportSaleItem {
    return {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity,
    };
  }

  private mergeRepeatedItems(items: ReportSaleItem[]): ReportSaleItem[] {
    const merged = new Map<number, ReportSaleItem>();

    for (const item of items) {
      const current = merged.get(item.productId);

      if (!current) {
        merged.set(item.productId, { ...item });
        continue;
      }

      current.quantity += item.quantity;
      current.subtotal += item.subtotal;
    }

    return [...merged.values()];
  }

  private getProductEntries(sales: ReportSale[]): Array<[string, number]> {
    const quantities = new Map<string, number>();

    for (const sale of sales) {
      for (const item of sale.items) {
        quantities.set(item.productName, (quantities.get(item.productName) ?? 0) + item.quantity);
      }
    }

    return [...quantities.entries()].sort((a, b) => b[1] - a[1]);
  }
}
