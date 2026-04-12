import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { CartService } from "../services/cart.service";
import { AuthService } from "../../auth/services/auth.service";
import { OrdersApiService } from "../../admin/services/orders-api.service";
import { CheckoutPayload, OrderChannel, OrderReceipt } from "../../../shared/models/order.interfaces";

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
    private authService = inject(AuthService);
    private ordersApiService = inject(OrdersApiService);

    cartItems = this.cartService.items;
    subtotal = this.cartService.subtotal;
    shipping = this.cartService.shipping;
    tax = this.cartService.tax;
    total = this.cartService.total;
    session = this.authService.session;

    checkoutForm = {
        name: '',
        email: '',
        phone: '',
        payment: 'Tarjeta',
        channel: 'Web' as OrderChannel,
        notes: ''
    };
    isSubmitting = false;
    checkoutMessage = '';
    lastReceipt: OrderReceipt | null = null;

    constructor() {
        this.prefillCustomerData();
    }

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
        if (!this.session()) {
            this.closeCart();
            void this.router.navigate(['/login-landing'], {
                queryParams: {
                    redirectTo: '/shopping-cart-landing'
                }
            });
            return;
        }

        this.checkoutMessage = 'Completa tus datos de entrega para enviar el pedido.';
        this.prefillCustomerData();
    }

    submitOrder(): void {
        if (!this.session()) {
            this.checkoutMessage = 'Necesitas iniciar sesión antes de enviar tu pedido.';
            return;
        }

        if (!this.checkoutForm.name.trim() || !this.checkoutForm.email.trim() || !this.checkoutForm.phone.trim()) {
            this.checkoutMessage = 'Completa nombre, correo y teléfono para continuar.';
            return;
        }

        if (!this.cartItems().length) {
            this.checkoutMessage = 'Tu carrito está vacío.';
            return;
        }

        const payload: CheckoutPayload = {
            customer: {
                name: this.checkoutForm.name.trim(),
                email: this.checkoutForm.email.trim(),
                phone: this.checkoutForm.phone.trim()
            },
            channel: this.checkoutForm.channel,
            payment: this.checkoutForm.payment,
            notes: this.checkoutForm.notes.trim(),
            items: this.cartItems(),
            subtotal: this.subtotal(),
            shipping: this.shipping(),
            tax: this.tax(),
            total: this.total()
        };

        this.isSubmitting = true;
        this.checkoutMessage = '';

        this.ordersApiService.createOrder(payload).subscribe({
            next: (receipt) => {
                this.lastReceipt = receipt;
                this.checkoutMessage = `Pedido ${receipt.id} registrado correctamente.`;
                this.cartService.clearCart();
                this.isSubmitting = false;
            },
            error: () => {
                this.checkoutMessage = 'No se pudo registrar el pedido en este momento.';
                this.isSubmitting = false;
            }
        });
    }

    private prefillCustomerData(): void {
        const session = this.session();

        if (!session) {
            return;
        }

        this.checkoutForm.name = session.user.name ?? this.checkoutForm.name;
        this.checkoutForm.email = session.user.email ?? this.checkoutForm.email;
    }
}
