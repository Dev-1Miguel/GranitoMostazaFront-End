import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { CartService } from "../services/cart.service";

@Component({
    selector: 'app-cart-main-section',
    templateUrl: './cart-main-section.html',
    styleUrls: ['./cart-main-section.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartMainSection {
    private cartService = inject(CartService);
    private router = inject(Router);

    cartItems = this.cartService.items;
    subtotal = this.cartService.subtotal;
    shipping = this.cartService.shipping;
    tax = this.cartService.tax;
    total = this.cartService.total;

    updateQuantity(productId: number, quantity: number): void {
        this.cartService.updateQuantity(productId, quantity);
    }

    removeItem(productId: number): void {
        this.cartService.removeFromCart(productId);
    }

    closeCart(): void {
        this.cartService.closeCart();
    }

    continueShopping(): void {
        this.closeCart();
        void this.router.navigate(['/menu']);
    }

    continueToCheckout(): void {
        this.closeCart();
        void this.router.navigate(['/login-landing']);
    }
}
