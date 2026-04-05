import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  imports: [CommonModule],
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
          { label: 'Productos en menu', value: `${allProducts.length}`, trend: 'Catalogo visible desde menu.json' },
          { label: 'Postres cargados', value: `${postres}`, trend: 'Categoria con mas variedad' },
          { label: 'Desayunos cargados', value: `${desayunos}`, trend: 'Buenos para la primera mitad del dia' },
          { label: 'Precio promedio', value: `$${averagePrice.toFixed(2)}`, trend: `${bebidas} bebidas activas en el menu` }
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
