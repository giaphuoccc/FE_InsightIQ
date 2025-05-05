import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, Observable, throwError, catchError, finalize, switchMap, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

// --- INTERFACE ĐÃ CẬP NHẬT ---
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string; // Cho Tenant
  phone: string;    // Cho User
  companyName: string; // Cho Tenant
  taxCode: string;     // Cho Tenant (Sẽ chuyển thành number khi gửi đi)
}

// Interface cho User DTO (Backend trả về sau khi tạo User)
export interface UserDto {
    id: number; // Quan trọng để lấy userId
    email: string;
    phoneNumber: string;
}

// Interface cho Tenant DTO (Backend trả về sau khi tạo Tenant)
export interface TenantDto {
    id: number;
    companyName: string;
    fullName: string;
    taxId: number;
    status: string;
    userId: number;
}


@Injectable({
  providedIn: 'root'
})
export class RegisterViewModel {
  // API URL cần trỏ đến proxy đã cấu hình
  // private readonly USER_API_URL = '/user';
  // private readonly TENANT_API_URL = '/tenant';

  private _isSubmitting = new BehaviorSubject<boolean>(false);
  isSubmitting$ = this._isSubmitting.asObservable();

  private _registrationError = new BehaviorSubject<string | null>(null);
  registrationError$ = this._registrationError.asObservable();

  // --- Thuộc tính industries không còn cần thiết ---
  // industries: string[] = [ ... ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  createForm(): FormGroup {
    // --- FORM GROUP ĐÃ CẬP NHẬT ---
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [ Validators.required, Validators.minLength(8) ]], // Bỏ pattern phức tạp nếu muốn
      confirmPassword: ['', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      // alternateContact: ['', [Validators.email]], // Xóa
      companyName: ['', [Validators.required]],
      taxCode: ['', [Validators.required]], // Có thể thêm Validators.pattern nếu cần format cụ thể
      // businessIndustry: ['', [Validators.required]], // Xóa
      // companyWebsite: ['', [Validators.pattern(/.../)]], // Xóa
      // businessAddress: ['', [Validators.required]], // Xóa
      // employeeCount: [null, [Validators.required, Validators.min(1)]], // Xóa
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    // Chỉ set lỗi nếu cả 2 field đã có giá trị và không khớp
    if (password?.value && confirmPassword?.value && password.value !== confirmPassword.value) {
        // Chỉ set lỗi nếu field confirmPassword chưa có lỗi khác
        if(!confirmPassword.errors || confirmPassword.errors['passwordMismatch']) {
           confirmPassword.setErrors({ passwordMismatch: true });
        }
        return { passwordMismatch: true }; // Trả về lỗi cho cả group để dễ kiểm tra form validity
    }
    // Nếu khớp hoặc một trong hai field rỗng, xóa lỗi mismatch (nếu có)
    else if (confirmPassword?.hasError('passwordMismatch')) {
       // Tạo một bản sao của errors, xóa passwordMismatch, và set lại
       const errors = {...confirmPassword.errors};
       delete errors['passwordMismatch'];
       // Nếu không còn lỗi nào khác, setErrors(null)
       confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    return null;
  }


  getErrorMessage(controlName: string, form: FormGroup): string {
    const control = form.get(controlName);

    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['pattern']) {
      if (controlName === 'phone') {
        return 'Please enter a valid phone number';
      }
      // Đã xóa companyWebsite
      // return 'Invalid format';
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }
    // Đã xóa employeeCount
    if (control.errors['requiredTrue']) {
      return 'You must accept the terms and conditions';
    }

    return 'Invalid input'; // Lỗi chung
  }

  // --- PHƯƠNG THỨC REGISTER VỚI LOGIC GỌI API THẬT ---
  register(registerData: RegisterRequest): Observable<TenantDto> {
    this._isSubmitting.next(true);
    this._registrationError.next(null);

    const userData = {
      email: registerData.email,
      password: registerData.password,
      phoneNumber: registerData.phone
    };

    return this.http.post<UserDto>('/user/create', userData) // Dùng đường dẫn proxy
      .pipe(
        switchMap(createdUser => {
          console.log('User created:', createdUser);
          if (!createdUser || typeof createdUser.id !== 'number') { // Kiểm tra ID là number
            this._registrationError.next('Failed to retrieve valid user ID after creation.');
            return throwError(() => new Error('Failed to retrieve valid user ID after creation.'));
          }

          const tenantData = {
            userId: createdUser.id,
            companyName: registerData.companyName,
            fullName: registerData.fullName,
            taxId: registerData.taxCode, // Chuyển sang number
            status: 'PENDING',
          };

          return this.http.post<TenantDto>('/tenant/create', tenantData); // Dùng đường dẫn proxy
        }),
        tap(createdTenant => {
          console.log('Tenant created successfully:', createdTenant);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Registration API call failed:', error);
          const errorMessage = error.error?.message || error.message || 'An unknown registration error occurred.';
          this._registrationError.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        finalize(() => {
          this._isSubmitting.next(false);
          console.log('Registration API call finished.');
        })
      );
  }

  // --- HÀM NÀY ĐÃ BỎ ĐIỀU HƯỚNG ---
  handleSuccessfulRegistration(createdTenant: TenantDto): void {
    console.log('Handling successful registration for tenant in ViewModel:', createdTenant);
    // Có thể làm gì đó khác ở đây nếu cần, ví dụ: xóa dữ liệu form, nhưng không điều hướng
    // localStorage.setItem('auth_token', response.token || ''); // Không cần nếu API không trả token ở đây

    // --- DÒNG ĐIỀU HƯỚNG ĐÃ BỊ COMMENT OUT ---
    // this.router.navigate(['/auth/registration-success']);
  }
}