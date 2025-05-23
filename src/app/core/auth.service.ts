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
  private readonly LOGIN_URL  = 'http://localhost:3001/auth/login';
  private readonly LOGOUT_URL = 'http://localhost:3001/auth/logout';

  constructor(private router: Router, private http: HttpClient) {}

  /** Gọi API login, xử lý role và lưu token nếu cần */
  login(credentials: { email: string; password: string }): Observable<{ role: string }> {
    return this.http
      .post<{ role: string }>(this.LOGIN_URL, credentials, { withCredentials: true })
      .pipe(
        tap((response) => {
          localStorage.setItem('user_role', response.role);
  
          // Điều hướng dựa vào vai trò
          if (response.role === 'SUPERADMIN') {
            this.router.navigate(['/dashboard_superadmin']);
          } else if (response.role === 'TENANT') {
            this.router.navigate(['/dashboard_tenant']);
          } else {
            throw new Error('Role undefined!');
          }
        }),
        catchError((error) => throwError(() => error))
      );
  }
  
  /** Gọi API logout rồi chuyển về login */
  logout(): void {
    this.http
      .post(this.LOGOUT_URL, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          // Xóa role khỏi localStorage
          localStorage.removeItem('user_role');
          // Điều hướng về login
          this.router.navigate(['']);
        },
        error: (err) => {
          console.error('Logout failed', err);
          // Vẫn xóa localStorage dù logout thất bại
          localStorage.removeItem('user_role');
          // Điều hướng về login
          this.router.navigate(['']);
        }
      });
  }
  

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
