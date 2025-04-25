// src/app/core/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {}

  /** Đăng nhập */
  login(/* tuỳ chọn thêm tham số credentials: LoginDto */): void {
    // TODO: Gọi API xác thực, nhận token, lưu vào localStorage/sessionStorage
    // localStorage.setItem('access_token', token);

    // Điều hướng tuỳ quyền
    // this.router.navigate(['/dashboard-super-admin']);
    this.router.navigate(['/dashboard-tenant']);
  }

  /** Đăng xuất */
  logout(): void {
    // Xoá token / dữ liệu phiên
    // localStorage.removeItem('access_token');

    // Quay về trang đăng nhập
    this.router.navigate(['/login']);
  }

  /** Kiểm tra đã đăng nhập chưa (tuỳ chọn)  */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }
}
