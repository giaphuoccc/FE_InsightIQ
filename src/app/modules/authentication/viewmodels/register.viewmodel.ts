import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, Observable, finalize, throwError, catchError, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  alternateContact?: string;
  companyName: string;
  taxCode: string;
  businessIndustry: string;
  companyWebsite?: string;
  businessAddress: string;
  employeeCount: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterViewModel {
  private readonly API_URL = 'https://api.example.com/auth'; // Replace with your actual API URL
  
  private _isSubmitting = new BehaviorSubject<boolean>(false);
  isSubmitting$ = this._isSubmitting.asObservable();
  
  private _registrationError = new BehaviorSubject<string | null>(null);
  registrationError$ = this._registrationError.asObservable();
  
  industries: string[] = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Services',
    'Entertainment',
    'Agriculture',
    'Energy',
    'Transportation',
    'Construction',
    'Other'
  ];
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}
  
  createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      ]],
      confirmPassword: ['', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[0-9]{8,15}$/)]],
      alternateContact: ['', [Validators.email]],
      companyName: ['', [Validators.required]],
      taxCode: ['', [Validators.required]],
      businessIndustry: ['', [Validators.required]],
      companyWebsite: ['', [Validators.pattern(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/)]],
      businessAddress: ['', [Validators.required]],
      employeeCount: [null, [Validators.required, Validators.min(1)]],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }
  
  getErrorMessage(controlName: string, form: FormGroup): string {
    const control = form.get(controlName);
    
    if (!control || !control.errors) {
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
      if (controlName === 'password') {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
      if (controlName === 'phone') {
        return 'Please enter a valid phone number';
      }
      if (controlName === 'companyWebsite') {
        return 'Please enter a valid website URL';
      }
      return 'Invalid format';
    }
    
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}`;
    }
    
    if (control.errors['requiredTrue']) {
      return 'You must accept the terms and conditions';
    }
    
    return 'Invalid input';
  }
  
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    this._isSubmitting.next(true);
    this._registrationError.next(null);
    
    // Simulate API call with fake implementation
    // In a real application, this would call the real API
    return this.fakeRegisterApi(registerData).pipe(
      finalize(() => this._isSubmitting.next(false)),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Registration failed. Please try again later.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this._registrationError.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  // Fake API implementation for demonstration
  private fakeRegisterApi(data: RegisterRequest): Observable<RegisterResponse> {
    // Simulate network delay
    return new Observable<RegisterResponse>(observer => {
      setTimeout(() => {
        // Simulate successful registration
        if (data.email !== 'existing@example.com') {
          observer.next({
            success: true,
            message: 'Registration successful',
            userId: '12345',
            token: 'fake-jwt-token'
          });
          observer.complete();
        } else {
          // Simulate error for existing email
          observer.error({
            error: {
              message: 'Email is already registered'
            }
          });
        }
      }, 1500);
    });
  }
  
  // Handle successful registration
  handleSuccessfulRegistration(response: RegisterResponse): void {
    // Save token or user data to local storage if needed
    localStorage.setItem('auth_token', response.token || '');
    
    // Navigate to dashboard or confirmation page
    this.router.navigate(['/auth/registration-success']);
  }
}