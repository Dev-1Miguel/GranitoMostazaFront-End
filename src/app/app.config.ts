import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
} from "@angular/router";
import { routes } from "./app.routes";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeng/themes/aura";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        anchorScrolling: "enabled",
        scrollPositionRestoration: "enabled",
      })
    ),
    provideAnimations(),
    provideHttpClient(),
    providePrimeNG({
      ripple: true,
      inputStyle: "outlined",
      theme: {
        preset: Aura,
      },
    }),
  ],
};
