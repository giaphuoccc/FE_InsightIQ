// login.component.ts (Đã dọn dẹp)
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Giữ lại Router nếu cần
import { LoginViewModel } from '../viewmodels/login.viewmodel';
// import { AuthService } from '../../../core/auth.service'; // Có thể không cần ở đây nữa

@Component({
  selector: 'login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginViewModel] // Cung cấp ViewModel tại đây
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;

  // Bỏ AuthService nếu không dùng trực tiếp ở component
  constructor(
    private fb: FormBuilder,
    public vm: LoginViewModel, // Inject ViewModel
    private router: Router // Giữ lại Router nếu cần cho việc khác (như forgot password)
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Getter f giữ nguyên để truy cập control trong template
  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true; // Đánh dấu đã submit để hiển thị lỗi validation nếu có

    // Nếu form không hợp lệ, không làm gì cả
    if (this.loginForm.invalid) {
      console.log("Form is invalid");
      return;
    }

    // Gọi hàm login từ ViewModel
    console.log("Calling vm.login");
    this.vm.login(
      this.loginForm.value.email,
      this.loginForm.value.password
    );
    // ViewModel sẽ tự xử lý việc gọi API, loading, error, và navigation
  }

  // XÓA PHƯƠNG THỨC NÀY ĐI
  // onClickLogin(){
  //   // this.authService.login(); // Không cần gọi ở đây nữa
  // }

  onClickForgotPassword(){
    // Giữ lại nếu có chức năng quên mật khẩu
    this.router.navigate(['/forgot-password-form']); // Đảm bảo route này tồn tại
  }
}