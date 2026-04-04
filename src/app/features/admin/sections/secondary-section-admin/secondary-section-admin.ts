import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-secondary-section-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './secondary-section-admin.html',
  styleUrls: ['./secondary-section-admin.css']
})
export class SecondarySectionAdminComponent {
  readonly quickActions: QuickAction[] = [
    { title: 'Ver pedidos', description: 'Entrar rapido a lo que toca preparar o entregar.', icon: 'pi pi-shopping-bag' },
    { title: 'Actualizar productos', description: 'Cambiar precio, disponibilidad o descripcion del menu.', icon: 'pi pi-box' },
    { title: 'Marcar agotados', description: 'Ocultar lo que ya no se puede vender durante el dia.', icon: 'pi pi-ban' },
    { title: 'Revisar ventas', description: 'Mirar un resumen simple para saber como va la jornada.', icon: 'pi pi-chart-line' }
  ];
}
