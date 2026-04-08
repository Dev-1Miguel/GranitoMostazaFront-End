import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';
import { OrderItem, OrderStatus, OrderSummary } from '../../../../shared/models/order.interfaces';
import { OrdersApiService } from '../../services/orders-api.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-orders-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    FloatingHomeButtonComponent,
    ButtonModule,
    InputTextModule,
    RippleModule,
    TagModule
  ],
  templateUrl: './orders-landing.component.html',
  styleUrls: ['./orders-landing.component.css']
})
export class OrdersLandingComponent implements OnInit {
  private readonly ordersApiService = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line', route: '/admin/reportes' }
  ];

  readonly statusFilters: Array<OrderStatus | 'Todos'> = ['Todos', 'Pendiente', 'En preparacion', 'Listo', 'Entregado'];
  summary: OrderSummary[] = [];
  orders: OrderItem[] = [];
  searchTerm = '';
  showUrgentOnly = false;
  statusMessage = '';

  activeFilter: OrderStatus | 'Todos' = 'Todos';
  selectedOrder: OrderItem | null = null;

  ngOnInit(): void {
    this.ordersApiService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.orders = orders;
        this.summary = this.ordersApiService.buildSummary(this.orders);
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

  getStatusSeverity(status: OrderStatus): 'warn' | 'info' | 'success' | 'secondary' {
    if (status === 'Pendiente') return 'warn';
    if (status === 'En preparacion') return 'info';
    if (status === 'Listo') return 'success';
    return 'secondary';
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

  private updateOrderStatus(order: OrderItem, newStatus: OrderStatus): void {
    this.ordersApiService
      .updateOrderStatus(order.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrder) => this.applyOrderUpdate(updatedOrder, 'Estado enviado al flujo API.'),
        error: () =>
          this.applyOrderUpdate(
            { ...order, status: newStatus },
            'Estado actualizado localmente; falta persistencia del backend.'
          )
      });
  }

  private applyOrderUpdate(order: OrderItem, message: string): void {
    this.orders = this.orders.map((item) => (item.id === order.id ? order : item));
    this.summary = this.ordersApiService.buildSummary(this.orders);
    this.selectedOrder = this.orders.find((item) => item.id === order.id) ?? this.selectedOrder;
    this.statusMessage = message;
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
