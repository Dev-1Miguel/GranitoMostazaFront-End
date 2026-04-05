import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
}

@Component({
  selector: 'app-third-section-admin',
  standalone: true,
  imports: [CommonModule],
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
            category: 'Postres',
            quantity: `${data.postres.length} productos`,
            note: `Desde $${Math.min(...data.postres.map((product) => product.price)).toFixed(2)}`
          },
          {
            category: 'Desayunos',
            quantity: `${data.desayunos.length} productos`,
            note: `Hasta $${Math.max(...data.desayunos.map((product) => product.price)).toFixed(2)}`
          },
          {
            category: 'Bebidas',
            quantity: `${data.bebidas.length} productos`,
            note: `${this.getFirstProductName(data.bebidas)} destaca en esta categoria`
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
