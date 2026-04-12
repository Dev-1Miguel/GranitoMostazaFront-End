import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { AuthSession, LoginPayload, RegisterPayload } from "../../../shared/models/auth.interfaces";
import { buildApiUrl } from "../../../core/config/api-url.util";

@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = buildApiUrl("/auth/login");
  private readonly registerUrl = buildApiUrl("/auth/register");

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http.post<AuthSession>(this.loginUrl, payload);
  }

  register(payload: RegisterPayload): Observable<AuthSession | { message: string }> {
    return this.http.post<AuthSession | { message: string }>(this.registerUrl, payload);
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
}
