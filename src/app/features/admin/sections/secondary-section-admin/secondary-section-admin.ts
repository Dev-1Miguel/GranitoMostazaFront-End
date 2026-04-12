import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  cta: string;
}

@Component({
  selector: 'app-secondary-section-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './secondary-section-admin.html',
  styleUrls: ['./secondary-section-admin.css']
})
export class SecondarySectionAdminComponent {
  readonly quickActions: QuickAction[] = [
    { title: 'Pedidos', description: 'Controla que toca preparar, entregar o revisar segun el estado del pedido.', icon: 'pi pi-shopping-bag', route: '/admin/pedidos', cta: 'Abrir pedidos' },
    { title: 'Productos', description: 'Edita precios, categorias, imagenes y disponibilidad del catalogo actual.', icon: 'pi pi-box', route: '/admin/productos', cta: 'Abrir productos' },
    { title: 'Reportes', description: 'Consulta productos mas vendidos, menos vendidos y modalidad de consumo.', icon: 'pi pi-chart-line', route: '/admin/reportes', cta: 'Abrir reportes' },
    { title: 'Vista cliente', description: 'Vuelve al sitio principal para revisar como se ve la experiencia publica.', icon: 'pi pi-home', route: '/', cta: 'Ir al inicio' }
  ];
}
