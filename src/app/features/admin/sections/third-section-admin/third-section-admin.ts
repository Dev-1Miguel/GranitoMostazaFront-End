import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';

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
  private readonly destroyRef = inject(DestroyRef);

  orders: OrderItem[] = [];
  categorySummary: CategorySummary[] = [];

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.orders = this.buildOrders(data.postres, data.desayunos, data.bebidas);
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
  }

  private buildOrders(postres: Product[], desayunos: Product[], bebidas: Product[]): OrderItem[] {
    return [
      {
        customer: 'Pedido web #381',
        items: `${this.getFirstProductName(desayunos)} + ${this.getFirstProductName(bebidas)}`,
        status: 'Listo para entregar',
        eta: '2 min'
      },
      {
        customer: 'Mesa 04',
        items: `${this.getProductName(bebidas, 1)} + ${this.getProductName(postres, 8)}`,
        status: 'En preparacion',
        eta: '6 min'
      },
      {
        customer: 'Pedido web #382',
        items: `${this.getProductName(postres, 4)} + ${this.getProductName(bebidas, 0)}`,
        status: 'Pendiente',
        eta: '9 min'
      }
    ];
  }

  private getFirstProductName(products: Product[]): string {
    return products[0]?.name ?? 'Producto del menu';
  }

  private getProductName(products: Product[], index: number): string {
    return products[index]?.name ?? this.getFirstProductName(products);
  }
}
