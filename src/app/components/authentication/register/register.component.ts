import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// Đảm bảo RegisterRequest và TenantDto được import đúng và đã được cập nhật (bỏ trường dư thừa)
import { RegisterViewModel, RegisterRequest, TenantDto } from '../viewmodels/register.viewmodel';
import { Subject, takeUntil } from 'rxjs';
// Import NotificationComponent nếu bạn muốn dùng cách 2
// import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  // Thêm NotificationComponent vào đây nếu bạn dùng cách 2
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isSubmitting = false;
  registrationError: string | null = null;
  registrationSuccessMessage: string | null = null; // Thuộc tính lưu thông báo thành công

  private destroy$ = new Subject<void>();

  constructor(
    private registerViewModel: RegisterViewModel,
    private router: Router // Giữ lại nếu cần dùng cho việc khác
  ) {
    // Không cần lấy industries nữa
  }

  ngOnInit(): void {
    // Đảm bảo createForm trong ViewModel đã được cập nhật (bỏ control dư thừa)
    this.registerForm = this.registerViewModel.createForm();

    this.registerViewModel.isSubmitting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSubmitting => {
        this.isSubmitting = isSubmitting;
      });

    this.registerViewModel.registrationError$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.registrationError = error;
        if (error) {
            // Nếu có lỗi mới, xóa thông báo thành công cũ
            this.registrationSuccessMessage = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    // Chỉ báo lỗi nếu control tồn tại, không hợp lệ VÀ đã được chạm vào (touched) hoặc thay đổi (dirty)
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(fieldName: string): string {
    // Đảm bảo ViewModel đã cập nhật hàm này (bỏ lỗi cho trường dư thừa)
    return this.registerViewModel.getErrorMessage(fieldName, this.registerForm);
  }

  onSubmit(): void {
    // Reset thông báo trước khi submit
    this.registrationSuccessMessage = null;
    this.registrationError = null; // Có thể để ViewModel tự quản lý lỗi này thông qua BehaviorSubject

    if (this.registerForm.invalid || this.isSubmitting) {
      // Đánh dấu tất cả các control là touched để hiển thị lỗi validation
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formValue = this.registerForm.value;

    // Tạo data gửi đi với các trường đã được rút gọn
    // Đảm bảo kiểu 'RegisterRequest' đã được cập nhật trong file viewmodel
    const registerData: RegisterRequest = {
      email: formValue.email,
      password: formValue.password,
      fullName: formValue.fullName, // Thuộc Tenant
      phone: formValue.phone,       // Thuộc User
      companyName: formValue.companyName, // Thuộc Tenant
      taxCode: formValue.taxCode,         // Thuộc Tenant
    };

    // Gọi phương thức register từ ViewModel (đã thay thế fakeApi bằng HttpClient thật)
    this.registerViewModel.register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TenantDto) => { // Kiểu response tùy theo backend trả về
          console.log('Registration API call successful in component subscribe', response);

          // --- GÁN THÔNG BÁO THÀNH CÔNG ---
          this.registrationSuccessMessage = 'Registration successful! Please wait for administrator approval.';

          // Gọi hàm xử lý thành công trong ViewModel (đã bỏ điều hướng)
          this.registerViewModel.handleSuccessfulRegistration(response);

          window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang
        },
        error: (err) => {
          // Lỗi đã được ViewModel bắt và cập nhật vào registrationError$
          // Component sẽ tự động hiển thị lỗi qua binding `*ngIf="registrationError"`
          console.error('Subscription received error in component:', err);
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang khi có lỗi
        }
      });
  }
}