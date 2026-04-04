import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface OrderItem {
  customer: string;
  items: string;
  status: string;
  eta: string;
}

interface StockAlert {
  product: string;
  remaining: string;
  urgency: string;
}

@Component({
  selector: 'app-third-section-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './third-section-admin.html',
  styleUrls: ['./third-section-admin.css']
})
export class ThirdSectionAdminComponent {
  readonly orders: OrderItem[] = [
    { customer: 'Pedido web #381', items: 'Bolon mixto + jugo', status: 'Listo para entregar', eta: '2 min' },
    { customer: 'Mesa 04', items: '2 cafes, 1 croissant', status: 'En preparacion', eta: '6 min' },
    { customer: 'Pedido web #382', items: 'Cheesecake + cappuccino', status: 'Pendiente', eta: '9 min' }
  ];

  readonly stockAlerts: StockAlert[] = [
    { product: 'Queso manaba', remaining: '4 porciones', urgency: 'Comprar hoy' },
    { product: 'Maracuya', remaining: '2 litros', urgency: 'Usar con cuidado' },
    { product: 'Pan brioche', remaining: '10 unidades', urgency: 'Revisar al mediodia' }
  ];
}
