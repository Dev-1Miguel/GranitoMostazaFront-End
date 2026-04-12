import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';

interface AdminStat {
  label: string;
  value: string;
  trend: string;
}

@Component({
  selector: 'app-main-section-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './main-section-admin.html',
  styleUrls: ['./main-section-admin.css']
})
export class MainSectionAdminComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly destroyRef = inject(DestroyRef);

  stats: AdminStat[] = [];

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const postres = data.postres.length;
        const desayunos = data.desayunos.length;
        const bebidas = data.bebidas.length;
        const allProducts = [...data.postres, ...data.desayunos, ...data.bebidas];
        const averagePrice = this.calculateAveragePrice(allProducts);

        this.stats = [
          { label: 'Modulos activos', value: '3', trend: 'Pedidos, productos y reportes disponibles' },
          { label: 'Productos en menu', value: `${allProducts.length}`, trend: `${postres} postres, ${desayunos} desayunos, ${bebidas} bebidas` },
          { label: 'Pedidos visibles', value: '5', trend: 'Base operativa inicial del modulo de pedidos' },
          { label: 'Ticket promedio', value: `$${averagePrice.toFixed(2)}`, trend: 'Referencia rapida para revisar precios del catalogo' }
        ];
      });
  }

  private calculateAveragePrice(products: Product[]): number {
    if (!products.length) {
      return 0;
    }

    const total = products.reduce((sum, product) => sum + product.price, 0);
    return total / products.length;
  }
}
