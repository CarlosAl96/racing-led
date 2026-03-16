import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ToastService } from '../../core/services/toast.service';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected async login(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.controls.email.value.trim().toLowerCase();
    const password = this.form.controls.password.value;

    this.isSubmitting.set(true);

    const result = await this.adminAuthService.signInWithEmailPassword(email, password);

    this.isSubmitting.set(false);

    if (!result.ok) {
      this.toastService.setMessage({
        severity: 'error',
        summary: 'Acceso denegado',
        detail: result.message ?? 'No se pudo iniciar sesion.',
      });
      return;
    }

    this.toastService.setMessage({
      severity: 'success',
      summary: 'Sesion iniciada',
      detail: 'Bienvenido al panel de administrador.',
    });

    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/admin/productos';
    await this.router.navigateByUrl(redirectTo);
  }

  protected hasError(control: keyof LoginForm): boolean {
    const input = this.form.controls[control];
    return input.invalid && (input.dirty || input.touched);
  }
}
