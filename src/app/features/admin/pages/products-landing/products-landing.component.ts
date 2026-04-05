import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';
import { MenuDataService } from '../../../menu/menu-data.service';
import { Product } from '../../../../shared/models/product.interfaces';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

type ProductCategoryKey = 'postres' | 'desayunos' | 'bebidas';
type ProductStatus = 'Activo' | 'Inactivo';

interface ProductAdminItem extends Product {
  category: ProductCategoryKey;
  status: ProductStatus;
}

interface ProductFormModel {
  id: number | null;
  name: string;
  description: string;
  price: number | null;
  image: string;
  category: ProductCategoryKey;
  status: ProductStatus;
}

@Component({
  selector: 'app-products-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, FloatingHomeButtonComponent],
  templateUrl: './products-landing.component.html',
  styleUrls: ['./products-landing.component.css']
})
export class ProductsLandingComponent implements OnInit {
  private readonly menuDataService = inject(MenuDataService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pageSize = 4;

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line' }
  ];

  readonly categoryFilters: Array<{ key: ProductCategoryKey | 'todos'; label: string }> = [
    { key: 'todos', label: 'Todas' },
    { key: 'postres', label: 'Postres' },
    { key: 'desayunos', label: 'Desayunos' },
    { key: 'bebidas', label: 'Bebidas' }
  ];

  readonly statusFilters: Array<ProductStatus | 'Todos'> = ['Todos', 'Activo', 'Inactivo'];

  products: ProductAdminItem[] = [];
  selectedProduct: ProductAdminItem | null = null;
  productSearch = '';
  activeCategory: ProductCategoryKey | 'todos' = 'todos';
  activeStatus: ProductStatus | 'Todos' = 'Todos';
  isCreating = false;
  currentPage = 1;

  form: ProductFormModel = this.createEmptyForm();

  ngOnInit(): void {
    this.menuDataService
      .getMenuData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.products = this.flattenProducts(data);
        this.selectedProduct = this.filteredProducts[0] ?? this.products[0] ?? null;
        if (this.selectedProduct) {
          this.form = { ...this.selectedProduct };
        }
      });
  }

  get filteredProducts(): ProductAdminItem[] {
    return this.products.filter((product) => {
      const matchesSearch =
        !this.productSearch ||
        product.name.toLowerCase().includes(this.productSearch.toLowerCase()) ||
        product.description.toLowerCase().includes(this.productSearch.toLowerCase());

      const matchesCategory =
        this.activeCategory === 'todos' || product.category === this.activeCategory;

      const matchesStatus =
        this.activeStatus === 'Todos' || product.status === this.activeStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  get paginatedProducts(): ProductAdminItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProducts(): number {
    return this.products.filter((product) => product.status === 'Activo').length;
  }

  get inactiveProducts(): number {
    return this.products.filter((product) => product.status === 'Inactivo').length;
  }

  get categoryLabel(): string {
    const current = this.categoryFilters.find((item) => item.key === this.activeCategory);
    return current?.label ?? 'Todas';
  }

  setCategoryFilter(category: ProductCategoryKey | 'todos'): void {
    this.activeCategory = category;
    this.currentPage = 1;
    this.ensureSelectedProductVisible();
  }

  setStatusFilter(status: ProductStatus | 'Todos'): void {
    this.activeStatus = status;
    this.currentPage = 1;
    this.ensureSelectedProductVisible();
  }

  onSearchChange(value: string): void {
    this.productSearch = value;
    this.currentPage = 1;
    this.ensureSelectedProductVisible();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.ensureSelectedProductVisible();
  }

  startCreateProduct(): void {
    this.isCreating = true;
    this.selectedProduct = null;
    this.currentPage = 1;
    this.form = this.createEmptyForm();
  }

  selectProduct(product: ProductAdminItem): void {
    this.isCreating = false;
    this.selectedProduct = product;
    this.form = { ...product };
  }

  saveProduct(): void {
    const normalizedName = this.form.name.trim();
    const normalizedDescription = this.form.description.trim();
    const normalizedImage = this.form.image.trim();

    if (!normalizedName || !normalizedDescription || this.form.price === null || !normalizedImage) {
      return;
    }

    if (this.isCreating) {
      const newProduct: ProductAdminItem = {
        id: this.getNextIdForCategory(this.form.category),
        name: normalizedName,
        description: normalizedDescription,
        price: Number(this.form.price),
        image: normalizedImage,
        category: this.form.category,
        status: this.form.status
      };

      this.products = [newProduct, ...this.products];
      this.currentPage = 1;
      this.selectedProduct = newProduct;
      this.isCreating = false;
      this.form = { ...newProduct };
      return;
    }

    if (!this.selectedProduct) {
      return;
    }

    this.products = this.products.map((product) =>
      product.id === this.selectedProduct?.id && product.category === this.selectedProduct?.category
        ? {
            ...product,
            name: normalizedName,
            description: normalizedDescription,
            price: Number(this.form.price),
            image: normalizedImage,
            category: this.form.category,
            status: this.form.status
          }
        : product
    );

    this.selectedProduct =
      this.products.find(
        (product) =>
          product.id === (this.form.id ?? this.selectedProduct?.id) && product.category === this.form.category
      ) ?? null;

    if (this.selectedProduct) {
      this.form = { ...this.selectedProduct };
    }
  }

  toggleStatus(product: ProductAdminItem, event?: Event): void {
    event?.stopPropagation();

    this.products = this.products.map((item) =>
      item === product
        ? {
            ...item,
            status: item.status === 'Activo' ? 'Inactivo' : 'Activo'
          }
        : item
    );

    if (this.selectedProduct && this.selectedProduct === product) {
      this.selectedProduct =
        this.products.find((item) => item.id === product.id && item.category === product.category) ?? null;

      if (this.selectedProduct) {
        this.form = { ...this.selectedProduct };
      }
    }
  }

  getStatusClass(status: ProductStatus): string {
    return `product-status product-status--${status.toLowerCase()}`;
  }

  getCategoryLabel(category: ProductCategoryKey): string {
    return this.categoryFilters.find((item) => item.key === category)?.label ?? category;
  }

  trackByProduct(index: number, product: ProductAdminItem): string {
    return `${product.category}-${product.id}`;
  }

  private ensureSelectedProductVisible(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (!this.selectedProduct) {
      this.selectedProduct = this.paginatedProducts[0] ?? this.filteredProducts[0] ?? null;
      if (this.selectedProduct) {
        this.form = { ...this.selectedProduct };
      }
      return;
    }

    const stillVisible = this.paginatedProducts.some(
      (product) =>
        product.id === this.selectedProduct?.id && product.category === this.selectedProduct?.category
    );

    if (!stillVisible) {
      this.selectedProduct = this.paginatedProducts[0] ?? this.filteredProducts[0] ?? null;
      if (this.selectedProduct) {
        this.isCreating = false;
        this.form = { ...this.selectedProduct };
      }
    }
  }

  private flattenProducts(data: {
    postres: Product[];
    desayunos: Product[];
    bebidas: Product[];
  }): ProductAdminItem[] {
    return (['postres', 'desayunos', 'bebidas'] as ProductCategoryKey[]).flatMap((category) =>
      (data[category] ?? []).map((product) => ({
        ...product,
        category,
        status: 'Activo' as ProductStatus
      }))
    );
  }

  private getNextIdForCategory(category: ProductCategoryKey): number {
    const categoryProducts = this.products.filter((product) => product.category === category);
    return (Math.max(0, ...categoryProducts.map((product) => product.id)) || 0) + 1;
  }

  private createEmptyForm(): ProductFormModel {
    return {
      id: null,
      name: '',
      description: '',
      price: null,
      image: '',
      category: 'postres',
      status: 'Activo'
    };
  }
}
