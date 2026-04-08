import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MainSectionAdminComponent } from '../../sections/main-section-admin/main-section-admin';
import { SecondarySectionAdminComponent } from '../../sections/secondary-section-admin/secondary-section-admin';
import { ThirdSectionAdminComponent } from '../../sections/third-section-admin/third-section-admin';
import { FourthSectionAdminComponent } from '../../sections/fourth-section-admin/fourth-section-admin';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-admin-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MainSectionAdminComponent,
    SecondarySectionAdminComponent,
    ThirdSectionAdminComponent,
    FourthSectionAdminComponent,
    FloatingHomeButtonComponent
  ],
  templateUrl: './admin-landing.component.html',
  styleUrls: ['./admin-landing.component.css']
})
export class AdminLandingComponent {
  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line', route: '/admin/reportes' }
  ];
}
