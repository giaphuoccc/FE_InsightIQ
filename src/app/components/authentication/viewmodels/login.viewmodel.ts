import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from "jwt-decode";

interface JwtTokenPayload {
  userId: number;
  email: string;
  role: 'TENANT' | 'SUPERADMIN';
  tenantId?: number;
  superAdminId?: number;
  userChatbotId?: number;
  iat: number;
  exp: number;
}


@Injectable()
export class LoginViewModel {
  private _isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading.asObservable();

  private _loginError = new BehaviorSubject<string | null>(null);
  loginError$ = this._loginError.asObservable();

  constructor(
      private router: Router,
      private http: HttpClient
  ) {}

  // Sửa lại hàm login hoàn toàn
  login(email: string, password: string): void { // Không dùng async/Promise nữa
    this._isLoading.next(true);
    this._loginError.next(null); // Reset lỗi cũ

    this.http.post<{token: string}>('/auth/login', { email, password }) // Gọi API qua proxy
      .pipe(
        tap((response) => {
          // --- Xử lý khi API trả về thành công (status 2xx) ---
          console.log('Login API successful:', response);
          const token = response.token;

          if (token) {
            try {
              // 1. Giải mã token (ví dụ)
              const decodedToken = jwtDecode<JwtTokenPayload>(token);
              console.log('Decoded Token:', decodedToken);
              const userRole = decodedToken.role;

              // (Tùy chọn) Lưu token vào localStorage nếu cần
              // localStorage.setItem('jwt_token', token);

              // 2. Điều hướng dựa trên role
              if (userRole === 'TENANT') {
                this.router.navigate(['/dashboard-tenant']); // Đảm bảo route này tồn tại
              } else if (userRole === 'SUPERADMIN') {
                this.router.navigate(['/dashboard-superadmin']); // Đảm bảo route này tồn tại
              } else {
                console.warn('Unknown or unhandled user role for navigation:', userRole);
                this.router.navigate(['/']); // Trang mặc định
              }

            } catch (e) {
              console.error("Error decoding token:", e);
              this._loginError.next('Login succeeded but failed to process user data.');
            }
          } else {
             console.error("Login response did not include a token.");
             this._loginError.next('Login failed: Invalid response from server.');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // --- Xử lý khi API trả về lỗi (status 4xx, 5xx) ---
          console.error('Login API failed:', error);
          // Ưu tiên message lỗi từ body của backend
          const message = error.error?.message ||
                          (error.status === 400 ? 'Invalid email or password.' : 'Login failed. Please try again later.');
          this._loginError.next(message); // Cập nhật lỗi để component hiển thị
          return throwError(() => error); // Ném lại lỗi (quan trọng cho xử lý bên ngoài nếu cần)
        }),
        finalize(() => {
          // --- Luôn chạy khi Observable kết thúc (thành công hoặc lỗi) ---
          this._isLoading.next(false); // Tắt trạng thái loading
        })
      )
      .subscribe(); // <-- Quan trọng: Phải subscribe để request được gửi đi!
  }
}