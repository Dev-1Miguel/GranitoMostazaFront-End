import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from '@angular/router';
import { catchError, finalize, of } from "rxjs";
import { FloatingBackButtonComponent } from '../../../../shared/components/floating-back-button/floating-back-button.component';
import { environment } from "../../../../../environments/environment";
import { AuthApiService } from "../../services/auth-api.service";

@Component({
    selector: 'app-newAccount',
    templateUrl: './newAccount.html',
    styleUrl: './newAccount.css',
    standalone: true,
    imports: [CommonModule, RouterModule, FloatingBackButtonComponent, ReactiveFormsModule]
})
export class NewAccount {
    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);

    readonly form = this.fb.nonNullable.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
        acceptTerms: [false, Validators.requiredTrue],
        wantsPromotions: [false]
    });

    isSubmitting = false;
    message = '';

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.message = 'Completa el formulario y acepta los términos.';
            return;
        }

        const payload = this.form.getRawValue();

        if (payload.password !== payload.confirmPassword) {
            this.message = 'La confirmación de contraseña no coincide.';
            return;
        }

        this.isSubmitting = true;
        this.message = '';

        this.authApiService
            .register(payload)
            .pipe(
                catchError(() =>
                    environment.useMockFallback
                        ? this.authApiService.createMockSession(payload.email)
                        : of(null)
                ),
                finalize(() => {
                    this.isSubmitting = false;
                })
            )
            .subscribe((result) => {
                this.message = result
                    ? 'Registro listo para integrarse con el API. El formulario ya envía un payload real.'
                    : 'No se pudo registrar porque el API aún no está disponible.';
            });
    }
}
