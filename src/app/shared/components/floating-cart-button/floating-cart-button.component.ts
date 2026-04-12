import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, HostListener, inject } from "@angular/core";
import { CartService } from "../../../features/cart/services/cart.service";

@Component({
  selector: "app-floating-cart-button",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./floating-cart-button.component.html",
  styleUrl: "./floating-cart-button.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingCartButtonComponent {
  public cartService = inject(CartService);
  isScrolled = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    // Si Navbar ya no se ve (generalmente después de ~150px)
    this.isScrolled = window.scrollY > 150;
  }

  get isVisible(): boolean {
    // Visible si hemos ahondado en la pagina y si hay items agregados al carrito
    return this.isScrolled && this.cartService.totalItems() > 0 && !this.cartService.isCartOpen();
  }

  openCart(): void {
    this.cartService.openCart();
  }
}
