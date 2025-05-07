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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule]
})
export class RegisterComponent implements OnInit {
  /** Reactive registration form */
  registerForm!: FormGroup;

  /** Loading state for the confirm button */
  isSubmitting = false;

  /** Optional error banner for API failures */
  registrationError: string | null = null;

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

  /** Submit handler */
  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.registrationError = null;

    const {
      email,
      password,
      fullName,
      phone,
      companyName,
      taxCode
    } = this.registerForm.value;

    const registerData = {
      email,
      password,
      fullName,
      phone,
      companyName,
      taxCode
    };

    this.http.post('/api/register', registerData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.registrationError =
          err.error?.message || 'Registration failed. Please try again.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
