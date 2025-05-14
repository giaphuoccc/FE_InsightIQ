// src/app/core/auth.guard.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private hasAuthToken(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return document.cookie
      .split(';')
      .some(c => c.trim().startsWith('access_token='));
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.hasAuthToken()) {
      return true;
    }
    // no token → redirect to login
    this.router.navigate(['']);
    return false;
  }
}
