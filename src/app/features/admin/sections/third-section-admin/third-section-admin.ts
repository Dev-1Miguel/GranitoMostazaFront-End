import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';
import { OrdersApiService } from '../../services/orders-api.service';

interface OrderItem {
  customer: string;
  items: string;
  status: string;
  eta: string;
}

interface CategorySummary {
  category: string;
  quantity: string;
  note: string;
  route: string;
}

@Component({
  selector: 'app-third-section-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './third-section-admin.html',
  styleUrls: ['./third-section-admin.css']
})
export class ThirdSectionAdminComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly ordersApiService = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  orders: OrderItem[] = [];
  categorySummary: CategorySummary[] = [];

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.categorySummary = [
          {
            category: 'Pedidos',
            quantity: 'Seguimiento operativo',
            note: 'Entra para cambiar estados y revisar el detalle de cada pedido.',
            route: '/admin/pedidos'
          },
          {
            category: 'Productos',
            quantity: `${data.postres.length + data.desayunos.length + data.bebidas.length} productos visibles`,
            note: `Desde ${this.getFirstProductName(data.desayunos)} hasta ${this.getFirstProductName(data.postres)}.`,
            route: '/admin/productos'
          },
          {
            category: 'Reportes',
            quantity: 'Analisis por dia, mes y anio',
            note: 'Consulta ventas, productos mas movidos y descarga el Excel.',
            route: '/admin/reportes'
          }
        ];
      });

    this.ordersApiService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.orders = orders.slice(0, 3).map((order) => ({
          customer: `${order.id} · ${order.customer}`,
          items: order.summary,
          status: order.status,
          eta: order.time
        }));
      });
  }

  private getFirstProductName(products: Product[]): string {
    return products[0]?.name ?? 'Producto del menu';
  }
}
