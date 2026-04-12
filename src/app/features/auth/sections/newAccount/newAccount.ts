import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { catchError, finalize, of, TimeoutError } from "rxjs";
import { FloatingBackButtonComponent } from '../../../../shared/components/floating-back-button/floating-back-button.component';
import { AuthSession } from "../../../../shared/models/auth.interfaces";
import { environment } from "../../../../../environments/environment";
import { AuthApiService } from "../../services/auth-api.service";
import { AuthService } from "../../services/auth.service";

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
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

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
                catchError((error) => {
                    if (environment.useMockFallback) {
                        return this.authApiService.createMockSession(payload.email);
                    }

                    this.message = this.getAuthErrorMessage(error, 'registrarte');
                    return of(null);
                }),
                finalize(() => {
                    this.isSubmitting = false;
                })
            )
            .subscribe((result: AuthSession | { message: string } | null) => {
                if (!result) {
                    this.message = 'No se pudo registrar.';
                    return;
                }

                if ('message' in result) {
                    this.message = result.message;
                    return;
                }

                this.authService.setSession(result);
                this.message = 'Cuenta creada correctamente.';
                this.form.reset();
                const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
                const fallbackRoute = result.user.role === 'admin' ? '/admin' : '/';
                void this.router.navigateByUrl(redirectTo || fallbackRoute);
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
