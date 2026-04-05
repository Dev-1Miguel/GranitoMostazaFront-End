import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';

interface ProductInsight {
  name: string;
  metric: string;
  note: string;
}

@Component({
  selector: 'app-fourth-section-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fourth-section-admin.html',
  styleUrls: ['./fourth-section-admin.css']
})
export class FourthSectionAdminComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly destroyRef = inject(DestroyRef);

  insights: ProductInsight[] = [];

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.insights = [
          this.toInsight(data.desayunos[0], 'Desayuno visible en el menu'),
          this.toInsight(data.bebidas[0], 'Bebida clave del catalogo'),
          this.toInsight(data.postres[0], 'Postre destacado del menu')
        ].filter((item): item is ProductInsight => Boolean(item));
      });
  }

  private toInsight(product: Product | undefined, note: string): ProductInsight | null {
    if (!product) {
      return null;
    }

    return {
      name: product.name,
      metric: `$${product.price.toFixed(2)}`,
      note
    };
  }
}
