import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly isLogoutLoading = signal(false);
  protected readonly isAdminAuthenticated = this.adminAuthService.isAdminAuthenticated;
  protected readonly adminSections = [
    { label: 'Productos', link: '/admin/productos' },
    { label: 'Promociones', link: '/admin/promociones' },
  ];
  protected readonly adminDisplayName = computed(() => {
    const user = this.adminAuthService.adminUser();

    if (!user) {
      return '';
    }

    const fullName = user.user_metadata['full_name'];
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const firstName = user.user_metadata['first_name'];
    const lastName = user.user_metadata['last_name'];
    if (typeof firstName === 'string' && typeof lastName === 'string') {
      const joined = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (joined) {
        return joined;
      }
    }

    const name = user.user_metadata['name'];
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }

    return 'Administrador';
  });

  protected async logout(): Promise<void> {
    if (this.isLogoutLoading()) {
      return;
    }

    this.isLogoutLoading.set(true);
    await this.adminAuthService.signOut();
    this.isLogoutLoading.set(false);

    this.toastService.setMessage({
      severity: 'info',
      summary: 'Sesion cerrada',
      detail: 'Has salido del panel de administrador.',
    });

    await this.router.navigate(['/admin/login']);
  }
}
