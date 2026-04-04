import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
export class FourthSectionAdminComponent {
  readonly insights: ProductInsight[] = [
    { name: 'Bolon verde mixto', metric: '16 vendidos', note: 'Sigue siendo el producto mas pedido de la manana' },
    { name: 'Cappuccino de la casa', metric: '12 vendidos', note: 'Se mueve bien junto a postres y desayuno' },
    { name: 'Cheesecake maracuya', metric: '7 vendidos', note: 'Buen candidato para destacar cuando baja el flujo' }
  ];
}
