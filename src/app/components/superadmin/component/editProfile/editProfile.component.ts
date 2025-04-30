import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

// User Data interface
interface UserData {
  name: string;
  email: string;
  phone: string;
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-editProfile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './editProfile.component.html',
  styleUrls: ['./editProfile.component.css']
})
export class EditProfileComponent implements OnInit {
  // --- PROFILE SECTION ---
  userData: UserData = {
    name: 'Phuoc',
    email: 'Phuoc@gmail.com',
    phone: '0123456789'
  };
  userForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // --- NOTIFICATION MODAL ---
  notificationVisible = false;
  notificationMessage = '';
  private lastAction: 'edit' | 'password' | null = null;

  // --- PASSWORD CHANGE SECTION ---
  isChangePasswordMode = false;
  passwordForm!: FormGroup;

  // Mock current password
  private mockCurrentPassword = 'Phuo@1234';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router   
  ) {}

  ngOnInit(): void {
    // Load initial data & forms
    this.loadUserData();
    this.initPasswordForm();

    // Check mode from URL
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'edit') {
        this.lastAction = 'edit';
        this.editInformation();
      } else if (params['mode'] === 'password') {
        this.lastAction = 'password';
        this.changePassword();
      }
    });
  }

  /*** PROFILE FORM ***/
  initForm(): void {
    this.userForm = this.fb.group({
      name:    [this.userData.name, Validators.required],
      email:   [this.userData.email, [Validators.required, Validators.email]],
      phone:   [
        this.userData.phone,
        [
          Validators.required,
          Validators.pattern(/^(?:\+84|0)(?:3[2-9]|5[689]|7[06789]|8[1-9]|9[0-46-9])\d{7}$/)
        ]
      ]
    });
  }

  get formControls() {
    return this.userForm.controls;
  }

  loadUserData(): void {
    this.isLoading = true;
    this.error = null;
    this.getUserData().subscribe({
      next: resp => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.userData = resp.data;
          if (this.isEditMode) this.initForm();
        } else {
          this.error = resp.message || 'Failed to load user data';
        }
      },
      error: err => {
        this.isLoading = false;
        this.error = err.message || 'An error occurred while loading user data';
      }
    });
  }

  getUserData(): Observable<ApiResponse<UserData>> {
    // Mock HTTP GET  
    return of({ success: true, data: this.userData });
  }

  updateProfile(): void {
    if (this.userForm.invalid) {
      Object.values(this.formControls).forEach(c => c.markAsTouched());
      return;
    }
    this.isSubmitting = true;
    this.error = null;

    // Mock HTTP POST/PUT
    of({ success: true, data: this.userForm.value, message: 'Profile updated successfully' })
      .subscribe({
        next: resp => {
          this.isSubmitting = false;
          if (resp.success) {
            this.userData = resp.data!;
            this.isEditMode = false;
            this.notificationMessage = resp.message!;
            this.notificationVisible = true;
            this.lastAction = 'edit';
          } else {
            this.notificationMessage = resp.message || 'Failed to update profile';
            this.notificationVisible = true;
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.notificationMessage = 'Unable to update account information. Please try again later.';
          this.notificationVisible = true;
        }
      });
  }

  /*** EDIT MODE ***/
  editInformation(): void {
    this.isEditMode = true;
    this.isChangePasswordMode = false;
    this.initForm();
  }

  cancelEdit(): void {
    this.router.navigate(['/profile']);
  }

  /*** PASSWORD CHANGE ***/
  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [
                          Validators.required,
                          Validators.minLength(8),
                          Validators.pattern(/(?=.*\d)(?=.*[!@#$%^&*])/)
                        ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const np = form.get('newPassword')?.value;
    const cp = form.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  changePassword(): void {
    this.isChangePasswordMode = true;
    this.isEditMode = false;
  }

  backToProfile(): void {
    this.router.navigate(['/profile']);
  }

  submitPasswordChange(): void {
    const cur = this.passwordForm.get('currentPassword')!;
    const np  = this.passwordForm.get('newPassword')!;
    const m   = this.passwordForm.errors?.['mismatch'];

    if (cur.value !== this.mockCurrentPassword) {
      this.notificationMessage = 'Your current password is incorrect.';
      this.notificationVisible = true;
      this.lastAction = 'password';
      return;
    }
    if (np.invalid) {
      this.notificationMessage = 'Password must be ≥8 chars, include at least one digit and one special character.';
      this.notificationVisible = true;
      this.lastAction = 'password';
      return;
    }
    if (m) {
      this.notificationMessage = 'Passwords do not match.';
      this.notificationVisible = true;
      this.lastAction = 'password';
      return;
    }

    // Success
    this.notificationMessage = 'Password changed successfully!';
    this.notificationVisible = true;
    this.isChangePasswordMode = false;
    this.lastAction = 'password';
  }

  /*** MODAL DONE/✕ ***/
  onDone(): void {
    this.notificationVisible = false;

    if (this.lastAction === 'edit') {
      // TODO: call actual save API, e.g. this.http.post(...)
      this.router.navigate(['/profile']);
    } else if (this.lastAction === 'password') {
      // TODO: call actual change-password API
      this.router.navigate(['/profile']);
    }
  }
}
