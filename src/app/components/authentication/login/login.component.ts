import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NotificationComponent } from '../../../shared/notification/notification.component';
import { AuthService } from '../../../service/authentication/auth.service';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    NotificationComponent,
    NavbarComponent,
  ],
})
export class LoginComponent implements OnInit {
  /** Reactive form for login */
  loginForm!: FormGroup;

  /** Flag to show validation errors only after first submit */
  submitted = false;

  /** Disable the form & show spinner while waiting for API */
  isSubmitting = false;

  // Các thuộc tính để quản lý việc hiển thị box thông báo
  showNotificationModal = false;
  notificationMessage: string = '';
  notificationIsErorr: boolean = false;
  notificationConfirmText: string = 'Confirm';

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Không cần làm gì thêm vì AuthService đã điều hướng
      },
      error: (errorResponse) => {
        this.isSubmitting = false;
        this.notificationIsErorr = true;
        this.notificationConfirmText = 'Confirm';

        if (errorResponse.message === 'Role undefined!') {
          this.notificationMessage = 'Role undefined!';
        } else if (errorResponse.status === 400) {
          this.notificationMessage = 'Fail to login';
        } else if (errorResponse.status === 500) {
          this.notificationMessage =
            "Something's wrong with user's email or password or your account!";
        } else {
          this.notificationMessage =
            errorResponse.error && errorResponse.error.message
              ? errorResponse.error.message
              : 'An unexpected error occurred. Please try again!';
        }

        this.showNotificationModal = true;
      },
    });
  }

  handleNotificationConfirm(): void {
    this.showNotificationModal = false;
    // Không chuyển trang nếu là lỗi
  }
}
