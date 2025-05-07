// src/app/core/auth.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3001/auth/login';

  constructor(private router: Router, private http: HttpClient) {}

  /** Gọi API login, xử lý role và lưu token nếu cần */
  login(credentials: { email: string; password: string }): Observable<{ role: string }> {
    return this.http.post<{ role: string }>(this.API_URL, credentials, { withCredentials: true }).pipe(
      tap((response) => {
        // TODO: Lưu token nếu cần thiết
        // localStorage.setItem('access_token', token);

        // Điều hướng dựa vào vai trò
        if (response.role === 'SUPERADMIN') {
          this.router.navigate(['/dashboard_superadmin']);
        } else if (response.role === 'TENANT') {
          this.router.navigate(['/dashboard_tenant']);
        } else {
          throw new Error('Role undefined!');
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
