import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
export class MainSectionAdminComponent {
  readonly stats: AdminStat[] = [
    { label: 'Ventas de hoy', value: '$186', trend: 'Mejor que ayer en la manana' },
    { label: 'Pedidos pendientes', value: '7', trend: '3 por entregar' },
    { label: 'Productos pausados', value: '2', trend: 'Sin stock por ahora' },
    { label: 'Preparaciones listas', value: '11', trend: 'Buen ritmo del turno' }
  ];
}
