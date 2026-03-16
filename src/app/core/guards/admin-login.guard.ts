import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminLoginGuard: CanActivateFn = async () => {
  const adminAuthService = inject(AdminAuthService);
  const router = inject(Router);

  const hasValidSession = await adminAuthService.hasValidAdminSession();

  if (hasValidSession) {
    return router.createUrlTree(['/admin/productos']);
  }

  return true;
};
