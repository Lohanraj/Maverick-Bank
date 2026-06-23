import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isCustomer()) {
    return true;
  }

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
  } else {
    router.navigate([auth.isAdmin() ? '/admin' : '/employee']);
  }
  return false;
};

export const employeeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && (auth.isEmployee() || auth.isAdmin())) {
    return true;
  }

  router.navigate([auth.isLoggedIn() ? '/dashboard' : '/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }

  router.navigate([auth.isLoggedIn() ? '/dashboard' : '/login']);
  return false;
};
