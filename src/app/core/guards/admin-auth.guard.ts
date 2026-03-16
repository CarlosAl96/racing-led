import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn = async (_route, state) => {
  const adminAuthService = inject(AdminAuthService);
  const router = inject(Router);

  const hasValidSession = await adminAuthService.hasValidAdminSession();

  if (hasValidSession) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: {
      redirectTo: state.url,
    },
  });
};
