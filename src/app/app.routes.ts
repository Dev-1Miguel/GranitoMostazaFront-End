import { Routes } from '@angular/router';
import { HomeLandingComponent } from './features/home/pages/home-landing/home-landing.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeLandingComponent
    },
    {
        path: 'admin',
        loadComponent: () =>
            import('./features/admin/pages/admin-landing/admin-landing.component').then(
                (m) => m.AdminLandingComponent
            )
    },
    {
        path: 'admin/pedidos',
        loadComponent: () =>
            import('./features/admin/pages/orders-landing/orders-landing.component').then(
                (m) => m.OrdersLandingComponent
            )
    },
    {
        path: 'menu',
        loadComponent: () =>
            import('./features/menu/pages/menu-landing/menu-landing.component').then(
                (m) => m.MenuLandingComponent
            )
    },
    {
        path: 'shopping-cart-landing',
        loadComponent: () =>
            import('./features/cart/pages/shopping-cart-landing/shopping-cart-landing.component').then(
                (m) => m.ShoppingCartLandingComponent
            )
    },
    {
        path: 'login-landing',
        loadComponent: () =>
            import('./features/auth/pages/login-landing/login-landing.component').then(
                (m) => m.LoginLandingComponent
            )
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/sections/newAccount/newAccount').then(
                (m) => m.NewAccount
            )
    }

];
