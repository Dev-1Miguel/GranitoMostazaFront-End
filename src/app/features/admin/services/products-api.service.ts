import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { Product } from "../../../shared/models/product.interfaces";
import { MenuDataService } from "../../menu/menu-data.service";
import { buildApiUrl } from "../../../core/config/api-url.util";

export type ProductCategoryKey = "postres" | "desayunos" | "bebidas";
export type ProductStatus = "Activo" | "Inactivo";

export interface ProductAdminItem extends Product {
  category: ProductCategoryKey;
  status: ProductStatus;
}

export interface ProductFormModel {
  id: number | null;
  name: string;
  description: string;
  price: number | null;
  image: string;
  category: ProductCategoryKey;
  status: ProductStatus;
}

@Injectable({
  providedIn: "root",
})
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly menuDataService = inject(MenuDataService);
  private readonly productsUrl = buildApiUrl("/admin/products");

  getProducts(): Observable<ProductAdminItem[]> {
    return this.http.get<ProductAdminItem[]>(this.productsUrl).pipe(
      catchError(() => this.getMockProducts())
    );
  }

  createProduct(payload: ProductFormModel): Observable<ProductAdminItem> {
    return this.http.post<ProductAdminItem>(this.productsUrl, payload);
  }

  updateProduct(id: number, payload: ProductFormModel): Observable<ProductAdminItem> {
    return this.http.put<ProductAdminItem>(`${this.productsUrl}/${id}`, payload);
  }

  updateProductStatus(
    id: number,
    category: ProductCategoryKey,
    status: ProductStatus
  ): Observable<ProductAdminItem> {
    return this.http.patch<ProductAdminItem>(`${this.productsUrl}/${id}/status`, {
      category,
      status,
    });
  }

  private getMockProducts(): Observable<ProductAdminItem[]> {
    return this.menuDataService.getMenuData().pipe(
      map((data) =>
        (["postres", "desayunos", "bebidas"] as ProductCategoryKey[]).flatMap(
          (category) =>
            (data[category] ?? []).map((product) => ({
              ...product,
              category,
              status: "Activo" as ProductStatus,
            }))
        )
      )
    );
  }
}
