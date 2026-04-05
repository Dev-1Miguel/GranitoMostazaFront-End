import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

interface OrderSummary {
  label: string;
  value: number;
}

type OrderStatus = 'Pendiente' | 'En preparacion' | 'Listo' | 'Entregado';

interface OrderItem {
  id: string;
  customer: string;
  channel: string;
  summary: string;
  total: string;
  time: string;
  status: OrderStatus;
  notes: string;
  payment: string;
}

@Component({
  selector: 'app-orders-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FloatingHomeButtonComponent],
  templateUrl: './orders-landing.component.html',
  styleUrls: ['./orders-landing.component.css']
})
export class OrdersLandingComponent {
  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line' }
  ];

  readonly summary: OrderSummary[] = [
    { label: 'Pendientes', value: 2 },
    { label: 'En preparacion', value: 2 },
    { label: 'Listos', value: 1 },
    { label: 'Entregados', value: 4 }
  ];

  readonly statusFilters: Array<OrderStatus | 'Todos'> = ['Todos', 'Pendiente', 'En preparacion', 'Listo', 'Entregado'];

  readonly orders: OrderItem[] = [
    {
      id: '#381',
      customer: 'Ana Paredes',
      channel: 'Web',
      summary: 'Bolon mixto, jugo de naranja',
      total: '$11.50',
      time: '08:14',
      status: 'Pendiente',
      notes: 'Sin cebolla, retirar en local',
      payment: 'Transferencia'
    },
    {
      id: '#382',
      customer: 'Mesa 04',
      channel: 'Salon',
      summary: '2 cappuccinos, 1 croissant',
      total: '$9.00',
      time: '08:19',
      status: 'En preparacion',
      notes: 'Servir juntos',
      payment: 'Efectivo'
    },
    {
      id: '#383',
      customer: 'Luis Vera',
      channel: 'WhatsApp',
      summary: 'Cheesecake maracuya, cafe pasado',
      total: '$8.75',
      time: '08:27',
      status: 'Listo',
      notes: 'Delivery por retirar',
      payment: 'Pago movil'
    },
    {
      id: '#384',
      customer: 'Mesa 02',
      channel: 'Salon',
      summary: 'Tigrillo, chocolate caliente',
      total: '$10.25',
      time: '08:33',
      status: 'En preparacion',
      notes: 'Chocolate sin azucar',
      payment: 'Efectivo'
    },
    {
      id: '#385',
      customer: 'Marta Leon',
      channel: 'Web',
      summary: 'Waffle clasico, cold brew',
      total: '$12.00',
      time: '08:40',
      status: 'Pendiente',
      notes: 'Agregar cubiertos',
      payment: 'Tarjeta'
    }
  ];

  activeFilter: OrderStatus | 'Todos' = 'Todos';
  selectedOrder: OrderItem = this.orders[0];

  get filteredOrders(): OrderItem[] {
    if (this.activeFilter === 'Todos') {
      return this.orders;
    }

    return this.orders.filter((order) => order.status === this.activeFilter);
  }

  setFilter(filter: OrderStatus | 'Todos'): void {
    this.activeFilter = filter;

    const firstVisibleOrder = this.filteredOrders[0];
    if (firstVisibleOrder) {
      this.selectedOrder = firstVisibleOrder;
    }
  }

  selectOrder(order: OrderItem): void {
    this.selectedOrder = order;
  }

  getStatusClass(status: OrderStatus): string {
    return `status-pill status-pill--${status.toLowerCase().replace(/\s+/g, '-')}`;
  }
}
