import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AdminAuthService } from '../services/admin-auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const adminAuthService = inject(AdminAuthService);
  const accessToken = adminAuthService.adminAccessToken();

  if (!accessToken || !isProtectedProductsRequest(request.method, request.url)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );
};

function isProtectedProductsRequest(method: string, url: string): boolean {
  const normalizedMethod = method.toUpperCase();
  const pathname = extractPathname(url);

  if (normalizedMethod === 'POST' && pathname.endsWith('/functions/v1/hyper-worker')) {
    return false;
  }

  if (normalizedMethod === 'PUT' && pathname.includes('/functions/v1/super-service/')) {
    return true;
  }

  if (normalizedMethod === 'DELETE' && pathname.includes('/functions/v1/quick-api/')) {
    return true;
  }

  return false;
}

function extractPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    const baseUrl = environment.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
    return new URL(url, baseUrl).pathname;
  }
}
