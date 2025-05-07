import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationComponent } from '../../../shared/notification/notification.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule, NotificationComponent]
})
export class RegisterComponent implements OnInit {
  /** Reactive registration form */
  registerForm!: FormGroup;

  /** Loading state for the confirm button */
  isSubmitting = false;

  /** Optional error banner for API failures */
  registrationError: string | null = null;


  // Các thuộc tính để quản lý việc hiển thị Modal box thông báo
  showNotificationModal = false;
  notificationMessage: string ='';

  // Thuộc tính để quản lý thông báo thành công hay là lỗi
  notificationIsError: boolean = false;
  notificationConfirmText: string = 'Confirm'; // Text cho nút confirm


  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        fullName: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{7,15}$')]],
        companyName: ['', Validators.required],
        taxCode: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /** Custom validator to ensure password === confirmPassword */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pwd = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return pwd === confirm ? null : { passwordMismatch: true };
  }

  /** Field invalid helper used in template */
  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /** Simple error message generator */
  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control) return '';

    if (fieldName === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control.hasError('minlength')) {
      const len = control.getError('minlength').requiredLength;
      return `Minimum length is ${len} characters`;
    }
    if (control.hasError('pattern')) {
      if (fieldName === 'phone') {
        return 'Please enter a valid phone number';
      }
      return 'Invalid format';
    }
    return '';
  }

 /** Hàm xử lý khi người dùng bấm nút Đăng ký */
onSubmit(): void {

  // Bước 1: Kiểm tra form có hợp lệ không, hoặc đang trong quá trình gửi dữ liệu
  if (this.registerForm.invalid || this.isSubmitting) {
    // Đánh dấu toàn bộ các ô nhập liệu là đã chạm vào để hiện lỗi nếu có
    this.registerForm.markAllAsTouched();
    return; // Không làm gì thêm nếu form lỗi hoặc đang gửi
  }

  // Bước 2: Bắt đầu gửi -> bật trạng thái "đang gửi" và xoá lỗi cũ nếu có
  this.isSubmitting = true;
  this.registrationError = null;

  // Bước 3: Lấy dữ liệu người dùng đã nhập từ form
  const {
    email,
    password,
    fullName,
    phone,
    companyName,
    taxCode
  } = this.registerForm.value;

  // Bước 4: Chuẩn bị dữ liệu để gửi tạo User (chỉ cần email, password và số điện thoại)
  const userData = {
    email: email,
    password: password,
    phoneNumber: phone
  };

  // Bước 5: Gửi yêu cầu đến API để tạo tài khoản người dùng
  this.http.post<any>('/user/create', userData).subscribe({
    next: (userCreationResponse) => {
      // Bước 6: API trả về thông tin người dùng, lấy ra userId để dùng tiếp
      const userId = userCreationResponse.id;

      // Kiểm tra nếu không có userId trả về -> hiển thị lỗi và dừng
      if (!userId) {
        this.isSubmitting = false;
        // Bắt đầu hiển thị thông báo lỗi
        this.notificationIsError = true; // Đánh dấu là lỗi
        this.notificationMessage = 'Unexpected error: Did not receive a valid user ID after creation. Please try again.';
        this.notificationConfirmText = 'Confirm';
        this.showNotificationModal = true;
       // this.registrationError = 'Không lấy được ID người dùng sau khi tạo. Vui lòng thử lại.';
        // window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Bước 7: Chuẩn bị dữ liệu để tạo Tenant (công ty)
      const tenantData = {
        companyName: companyName,
        fullName: fullName,
        taxId: taxCode,      // Chú ý: API cần trường tên "taxId"
        status: 'PENDING',   // Trạng thái mặc định khi vừa đăng ký
        userId: userId       // Liên kết với người dùng vừa tạo
      };

      // Bước 8: Gửi yêu cầu đến API để tạo Tenant
      this.http.post<any>('/tenant/create', tenantData).subscribe({
        next: () => {
          // Bước 9: Tạo Tenant thành công
           this.isSubmitting = false; // Để trạng thái đang gửi là false lại
          // this.router.navigate(['/login']);
          this.notificationIsError = false;
          this.notificationMessage = 'Tenant account registration successful! Please verify to log in';
          this.notificationConfirmText = 'Go to login';
          this.showNotificationModal = true;
        },
        error: (tenantErr) => {
          // Bước 10: Có lỗi khi tạo Tenant
          this.isSubmitting = false;
          this.notificationIsError = true;
          this.notificationMessage = 'Failed to create company information. The user account may have been created. Please try again or contact support.';
          this.notificationConfirmText = 'Confirm';
          this.showNotificationModal = true;
         // this.registrationError = tenantErr.error?.message || 'Tạo công ty thất bại. Vui lòng thử lại.';
         // window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    },
    error: (userErr) => {
      // Bước 11: Có lỗi khi tạo User
      this.isSubmitting = false;
      this.notificationIsError = true;
      this.notificationMessage = 'Failed to create user account. Please check your information or try again later.';
      this.notificationConfirmText = 'Confirm';
      console.log(this.notificationConfirmText);
      this.showNotificationModal = true;
      //this.registrationError = userErr.error?.message || 'Tạo tài khoản người dùng thất bại. Vui lòng thử lại.';
      //window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// Hàm mới để đóng model và chuyển trang khi nhấn xác nhận
handleNotificationConfirm(): void{

  const wasErorr = this.notificationIsError; // Biến kiểm tra trạng thái lỗi trước khi ẩn model
  this.showNotificationModal = false;

  // Nếu không lỗi thì mới tiến hành chuyển trang
  if (!wasErorr) {
    this.showNotificationModal = false; // Ẩn model
    this.router.navigate(['/login']);
  }
}
}
