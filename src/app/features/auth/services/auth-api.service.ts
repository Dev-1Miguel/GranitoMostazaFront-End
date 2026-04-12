import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of, timeout } from "rxjs";
import { AuthSession, LoginPayload, RegisterPayload } from "../../../shared/models/auth.interfaces";
import { buildApiUrl } from "../../../core/config/api-url.util";

interface LoginApiPayload {
  correo: string;
  clave: string;
}

interface RegisterApiPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  clave: string;
  aceptaTerminos: boolean;
  deseaPromociones: boolean;
}

interface AuthApiResponse {
  token: string;
  rol: string;
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  private readonly requestTimeoutMs = 10000;
  private readonly http = inject(HttpClient);
  private readonly loginUrl = buildApiUrl("/auth/login");
  private readonly registerUrl = buildApiUrl("/auth/register");

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http
      .post<AuthApiResponse>(this.loginUrl, this.mapLoginPayload(payload))
      .pipe(
        timeout(this.requestTimeoutMs),
        map((response) => this.mapAuthSession(response))
      );
  }

  register(payload: RegisterPayload): Observable<AuthSession | { message: string }> {
    return this.http
      .post<AuthApiResponse | { message: string }>(
        this.registerUrl,
        this.mapRegisterPayload(payload)
      )
      .pipe(
        timeout(this.requestTimeoutMs),
        map((response) => ("token" in response ? this.mapAuthSession(response) : response))
      );
  }

  // Temporary helper so the UI can keep moving even before the backend exists.
  createMockSession(email: string, role: "admin" | "customer" = "customer"): Observable<AuthSession> {
    return of({
      token: "pending-api-token",
      user: {
        id: "local-user",
        name: email.split("@")[0] || "Usuario",
        email,
        role,
      },
    });
  }

  private mapLoginPayload(payload: LoginPayload): LoginApiPayload {
    return {
      correo: payload.email.trim(),
      clave: payload.password,
    };
  }

  private mapRegisterPayload(payload: RegisterPayload): RegisterApiPayload {
    return {
      nombres: payload.firstName.trim(),
      apellidos: payload.lastName.trim(),
      correo: payload.email.trim(),
      telefono: payload.phone.trim(),
      clave: payload.password,
      aceptaTerminos: payload.acceptTerms,
      deseaPromociones: payload.wantsPromotions,
    };
  }

  private mapAuthSession(response: AuthApiResponse): AuthSession {
    return {
      token: response.token,
      user: {
        id: response.usuarioId.toString(),
        name: response.nombreCompleto,
        email: response.correo,
        role: response.rol === "admin" ? "admin" : "customer",
      },
    };
  }
}
