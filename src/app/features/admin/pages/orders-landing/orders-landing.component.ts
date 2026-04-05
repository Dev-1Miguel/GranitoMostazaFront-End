import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';

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
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, FloatingHomeButtonComponent],
  templateUrl: './orders-landing.component.html',
  styleUrls: ['./orders-landing.component.css']
})
export class OrdersLandingComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line' }
  ];

  readonly statusFilters: Array<OrderStatus | 'Todos'> = ['Todos', 'Pendiente', 'En preparacion', 'Listo', 'Entregado'];
  summary: OrderSummary[] = [];
  orders: OrderItem[] = [];
  searchTerm = '';
  showUrgentOnly = false;

  activeFilter: OrderStatus | 'Todos' = 'Todos';
  selectedOrder: OrderItem | null = null;

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const catalog = [...data.postres, ...data.desayunos, ...data.bebidas];
        this.orders = this.buildOrders(catalog);
        this.summary = this.buildSummary(this.orders);
        this.selectedOrder = this.filteredOrders[0] ?? null;
      });
  }

  get filteredOrders(): OrderItem[] {
    return this.orders.filter((order) => {
      const matchesStatus = this.activeFilter === 'Todos' || order.status === this.activeFilter;
      const matchesSearch =
        !this.searchTerm ||
        order.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.summary.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesUrgent = !this.showUrgentOnly || this.isUrgent(order);

      return matchesStatus && matchesSearch && matchesUrgent;
    });
  }

  setFilter(filter: OrderStatus | 'Todos'): void {
    if (this.showUrgentOnly && (filter === 'Listo' || filter === 'Entregado')) {
      this.showUrgentOnly = false;
    }

    this.activeFilter = filter;
    this.syncSelectionWithVisibleOrders();
  }

  selectOrder(order: OrderItem): void {
    this.selectedOrder = order;
  }

  toggleUrgentFilter(): void {
    this.showUrgentOnly = !this.showUrgentOnly;

    if (this.showUrgentOnly && (this.activeFilter === 'Listo' || this.activeFilter === 'Entregado')) {
      this.activeFilter = 'Todos';
    }

    this.syncSelectionWithVisibleOrders();
  }

  openOrderDetail(order: OrderItem, event?: Event): void {
    event?.stopPropagation();
    this.selectOrder(order);
  }

  moveOrderStatus(order: OrderItem, event?: Event): void {
    event?.stopPropagation();
    this.updateOrderStatus(order, this.getNextStatus(order.status));
  }

  markAsReady(order: OrderItem | null, event?: Event): void {
    event?.stopPropagation();
    if (!order || order.status === 'Entregado') {
      return;
    }

    this.updateOrderStatus(order, 'Listo');
  }

  markAsDelivered(order: OrderItem | null, event?: Event): void {
    event?.stopPropagation();
    if (!order) {
      return;
    }

    this.updateOrderStatus(order, 'Entregado');
  }

  getStatusClass(status: OrderStatus): string {
    return `status-pill status-pill--${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  isUrgent(order: OrderItem): boolean {
    return order.status === 'Pendiente' || order.status === 'En preparacion';
  }

  canMarkReady(order: OrderItem | null): boolean {
    return !!order && order.status !== 'Listo' && order.status !== 'Entregado';
  }

  canMarkDelivered(order: OrderItem | null): boolean {
    return !!order && order.status !== 'Entregado';
  }

  private buildOrders(products: Product[]): OrderItem[] {
    const getProduct = (index: number): Product => products[index] ?? products[0];
    const makeTotal = (selected: Product[]) =>
      `$${selected.reduce((sum, product) => sum + product.price, 0).toFixed(2)}`;

    const combinations = [
      [getProduct(5), getProduct(33)],
      [getProduct(21), getProduct(8)],
      [getProduct(4), getProduct(34)],
      [getProduct(26), getProduct(39)],
      [getProduct(1), getProduct(42)]
    ];

    return [
      {
        id: '#381',
        customer: 'Ana Paredes',
        channel: 'Web',
        summary: `${combinations[0][0].name}, ${combinations[0][1].name}`,
        total: makeTotal(combinations[0]),
        time: '08:14',
        status: 'Pendiente',
        notes: 'Retirar en local',
        payment: 'Transferencia'
      },
      {
        id: '#382',
        customer: 'Mesa 04',
        channel: 'Salon',
        summary: `${combinations[1][0].name}, ${combinations[1][1].name}`,
        total: makeTotal(combinations[1]),
        time: '08:19',
        status: 'En preparacion',
        notes: 'Servir juntos',
        payment: 'Efectivo'
      },
      {
        id: '#383',
        customer: 'Luis Vera',
        channel: 'WhatsApp',
        summary: `${combinations[2][0].name}, ${combinations[2][1].name}`,
        total: makeTotal(combinations[2]),
        time: '08:27',
        status: 'Listo',
        notes: 'Delivery por retirar',
        payment: 'Pago movil'
      },
      {
        id: '#384',
        customer: 'Mesa 02',
        channel: 'Salon',
        summary: `${combinations[3][0].name}, ${combinations[3][1].name}`,
        total: makeTotal(combinations[3]),
        time: '08:33',
        status: 'En preparacion',
        notes: 'Sin azucar en la bebida',
        payment: 'Efectivo'
      },
      {
        id: '#385',
        customer: 'Marta Leon',
        channel: 'Web',
        summary: `${combinations[4][0].name}, ${combinations[4][1].name}`,
        total: makeTotal(combinations[4]),
        time: '08:40',
        status: 'Pendiente',
        notes: 'Agregar cubiertos',
        payment: 'Tarjeta'
      }
    ];
  }

  private buildSummary(orders: OrderItem[]): OrderSummary[] {
    return [
      { label: 'Pendientes', value: orders.filter((order) => order.status === 'Pendiente').length },
      { label: 'En preparacion', value: orders.filter((order) => order.status === 'En preparacion').length },
      { label: 'Listos', value: orders.filter((order) => order.status === 'Listo').length },
      { label: 'Entregados', value: orders.filter((order) => order.status === 'Entregado').length }
    ];
  }

  private getNextStatus(status: OrderStatus): OrderStatus {
    if (status === 'Pendiente') return 'En preparacion';
    if (status === 'En preparacion') return 'Listo';
    return 'Entregado';
  }

  private updateOrderStatus(order: OrderItem, newStatus: OrderStatus): void {
    this.orders = this.orders.map((item) =>
      item.id === order.id
        ? {
            ...item,
            status: newStatus
          }
        : item
    );

    this.summary = this.buildSummary(this.orders);
    this.selectedOrder = this.orders.find((item) => item.id === order.id) ?? this.selectedOrder;
    this.syncSelectionWithVisibleOrders();
  }

  private syncSelectionWithVisibleOrders(): void {
    const visibleOrders = this.filteredOrders;

    if (!visibleOrders.length) {
      this.selectedOrder = null;
      return;
    }

    const stillVisible = this.selectedOrder
      ? visibleOrders.some((order) => order.id === this.selectedOrder?.id)
      : false;

    if (!stillVisible) {
      this.selectedOrder = visibleOrders[0];
    }
  }
}
