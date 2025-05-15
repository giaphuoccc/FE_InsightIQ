// // src/app/core/auth.guard.ts
// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import {
//   CanActivate,
//   Router,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
// } from '@angular/router';
// import { isPlatformBrowser } from '@angular/common';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard implements CanActivate {
//   constructor(
//     private router: Router,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   canActivate(
//     _route: ActivatedRouteSnapshot,
//     _state: RouterStateSnapshot
//   ): boolean {
//     // Only evaluate in the browser
//     if (!isPlatformBrowser(this.platformId)) return false;

//     // Check for auth_token cookie
//     const hasToken = document.cookie
//       .split(';')
//       .some(c => c.trim().startsWith('auth_token='));

//     if (hasToken) {
//       return true;
//     }

//     // Not logged in → go to login
//     this.router.navigate(['']);
//     return false;
//   }
// }
