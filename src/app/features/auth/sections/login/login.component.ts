import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { FloatingBackButtonComponent } from '../../../../shared/components/floating-back-button/floating-back-button.component';
import { AuthApiService } from '../../services/auth-api.service';
import { environment } from '../../../../../environments/environment';

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
        catchError(() =>
          environment.useMockFallback
            ? this.authApiService.createMockSession(this.form.controls.email.value)
            : of(null)
        ),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe((session) => {
        this.message = session
          ? `Frontend listo para auth API. Sesion preparada para ${session.user.email}.`
          : 'No se pudo iniciar sesion porque el API aun no responde.';
      });
  }
}
