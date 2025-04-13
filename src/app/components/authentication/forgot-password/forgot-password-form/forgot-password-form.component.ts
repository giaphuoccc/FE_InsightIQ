import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'forgot-password-form',
  imports: [],
  templateUrl: './forgot-password-form.component.html',
  styleUrl: './forgot-password-form.component.css'
})
export class ForgotPasswordFormComponent {
  constructor(private router: Router) {}
  // Chuyển hướng đến trang đặt lại mật khẩu mới

  navigateToSetNewPassword() {
    this.router.navigate(['/set-new-password']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
