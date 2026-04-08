import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { FloatingHomeButtonComponent } from '../../../../shared/components/floating-home-button/floating-home-button.component';
import {
  ProductAdminItem,
  ProductCategoryKey,
  ProductFormModel,
  ProductStatus,
  ProductsApiService
} from '../../services/products-api.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-products-landing',
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
    TagModule,
    TextareaModule,
    PaginatorModule
  ],
  templateUrl: './products-landing.component.html',
  styleUrls: ['./products-landing.component.css']
})
export class ProductsLandingComponent implements OnInit {
  private readonly productsApiService = inject(ProductsApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pageSize = 4;

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin' },
    { label: 'Pedidos', icon: 'pi pi-shopping-bag', route: '/admin/pedidos' },
    { label: 'Productos', icon: 'pi pi-box', route: '/admin/productos' },
    { label: 'Reportes', icon: 'pi pi-chart-line', route: '/admin/reportes' }
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
  isSaving = false;
  currentPage = 1;
  saveMessage = '';

  form: ProductFormModel = this.createEmptyForm();

  ngOnInit(): void {
    this.productsApiService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.products = products;
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

  get totalProducts(): number {
    return this.products.length;
  }

  get firstRowIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
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

  onPaginatorPageChange(event: { page?: number }): void {
    this.currentPage = (event.page ?? 0) + 1;
    this.ensureSelectedProductVisible();
  }

  startCreateProduct(): void {
    this.isCreating = true;
    this.selectedProduct = null;
    this.currentPage = 1;
    this.saveMessage = '';
    this.form = this.createEmptyForm();
  }

  selectProduct(product: ProductAdminItem): void {
    this.isCreating = false;
    this.selectedProduct = product;
    this.saveMessage = '';
    this.form = { ...product };
  }

  saveProduct(): void {
    const normalizedName = this.form.name.trim();
    const normalizedDescription = this.form.description.trim();
    const normalizedImage = this.form.image.trim();

    if (!normalizedName || !normalizedDescription || this.form.price === null || !normalizedImage) {
      this.saveMessage = 'Completa todos los campos antes de guardar.';
      return;
    }

    this.isSaving = true;

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

      this.productsApiService
        .createProduct({ ...this.form, name: normalizedName, description: normalizedDescription, image: normalizedImage })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (createdProduct) => this.applySavedProduct(createdProduct),
          error: () => this.applySavedProduct(newProduct, 'Producto guardado localmente. El flujo API ya quedó preparado.')
        });
      return;
    }

    if (!this.selectedProduct) {
      this.isSaving = false;
      return;
    }

    const updatedProduct: ProductAdminItem = {
      ...this.selectedProduct,
      id: this.form.id ?? this.selectedProduct.id,
      name: normalizedName,
      description: normalizedDescription,
      price: Number(this.form.price),
      image: normalizedImage,
      category: this.form.category,
      status: this.form.status
    };

    this.productsApiService
      .updateProduct(updatedProduct.id, updatedProduct)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => this.applySavedProduct(product),
        error: () => this.applySavedProduct(updatedProduct, 'Cambios guardados localmente. Solo falta conectar persistencia real.')
      });
  }

  toggleStatus(product: ProductAdminItem, event?: Event): void {
    event?.stopPropagation();
    const nextStatus = product.status === 'Activo' ? 'Inactivo' : 'Activo';

    this.productsApiService
      .updateProductStatus(product.id, product.category, nextStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedProduct) => this.replaceProduct(updatedProduct),
        error: () => this.replaceProduct({ ...product, status: nextStatus })
      });
  }

  getStatusSeverity(status: ProductStatus): 'success' | 'danger' {
    return status === 'Activo' ? 'success' : 'danger';
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

  private applySavedProduct(product: ProductAdminItem, message = 'Formulario conectado a una capa lista para API.'): void {
    const existingIndex = this.products.findIndex(
      (item) => item.id === product.id && item.category === product.category
    );

    if (existingIndex >= 0) {
      this.products = this.products.map((item, index) => (index === existingIndex ? product : item));
    } else {
      this.products = [product, ...this.products];
    }

    this.currentPage = 1;
    this.selectedProduct = product;
    this.isCreating = false;
    this.isSaving = false;
    this.saveMessage = message;
    this.form = { ...product };
    this.ensureSelectedProductVisible();
  }

  private replaceProduct(product: ProductAdminItem): void {
    this.products = this.products.map((item) =>
      item.id === product.id && item.category === product.category ? product : item
    );

    if (
      this.selectedProduct &&
      this.selectedProduct.id === product.id &&
      this.selectedProduct.category === product.category
    ) {
      this.selectedProduct = product;
      this.form = { ...product };
    }

    this.saveMessage = 'Estado actualizado. Cuando exista el backend, este cambio ya saldrá por API.';
    this.ensureSelectedProductVisible();
  }
}
