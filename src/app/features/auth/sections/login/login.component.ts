import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, finalize, of, TimeoutError } from 'rxjs';
import { FloatingBackButtonComponent } from '../../../../shared/components/floating-back-button/floating-back-button.component';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../../environments/environment';
import { Router } from '@angular/router';
import { AuthSession } from '../../../../shared/models/auth.interfaces';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, FloatingBackButtonComponent, ReactiveFormsModule]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberSession: [false]
  });

  isSubmitting = false;
  message = '';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message = 'Completa correo y contraseña para probar el flujo.';
      return;
    }

    this.isSubmitting = true;
    this.message = '';

    this.authApiService
      .login(this.form.getRawValue())
      .pipe(
        catchError((error) => {
          if (environment.useMockFallback) {
            return this.authApiService.createMockSession(this.form.controls.email.value);
          }

          this.message = this.getAuthErrorMessage(error, 'iniciar sesión');
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((session: AuthSession | null | any) => {
        if (session) {
          this.authService.setSession(session as AuthSession);
          const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
          const fallbackRoute = (session as AuthSession).user.role === 'admin' ? '/admin' : '/';
          void this.router.navigateByUrl(redirectTo || fallbackRoute);
        } else {
          this.message = 'No se pudo iniciar sesión.';
        }
      });
  }

  private getAuthErrorMessage(error: unknown, action: 'iniciar sesión' | 'registrarte'): string {
    if (error instanceof TimeoutError) {
      return `El servidor tardó demasiado en responder al ${action}.`;
    }

    if (error instanceof HttpErrorResponse) {
      return error.error?.message || `No se pudo ${action} en este momento.`;
    }

    return `No se pudo ${action} en este momento.`;
  }
}
