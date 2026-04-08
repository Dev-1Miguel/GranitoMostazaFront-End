import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, shareReplay } from "rxjs";
import { MenuData } from "../../shared/models/menudata.interfaces";
import { Product } from "../../shared/models/product.interfaces";
import { CarouselItem } from "./sections/main-section-menu/interfaces/carouselItem.interfaces";
import { environment } from "../../../environments/environment";
import { buildApiUrl } from "../../core/config/api-url.util";

interface MenuCatalogData extends MenuData {
  bebidas: Product[];
  carouselItems: CarouselItem[];
}

@Injectable({
  providedIn: "root",
})
export class MenuDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = buildApiUrl("/catalog");
  private readonly fallbackUrl = "assets/data/menu.json";

  private readonly menuDataRequest$ = this.http
    .get<MenuCatalogData>(this.apiUrl)
    .pipe(
      catchError(() =>
        environment.useMockFallback
          ? this.http.get<MenuCatalogData>(this.fallbackUrl)
          : this.http.get<MenuCatalogData>(this.apiUrl)
      )
    )
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  getMenuData(): Observable<MenuCatalogData> {
    return this.menuDataRequest$;
  }

  getCategoryItems(
    category: "postres" | "desayunos" | "bebidas"
  ): Observable<Product[]> {
    return this.menuDataRequest$.pipe(map((data) => data[category] ?? []));
  }

  getCarouselItems(): Observable<CarouselItem[]> {
    return this.menuDataRequest$.pipe(
      map((data) => data.carouselItems ?? [])
    );
  }
}
