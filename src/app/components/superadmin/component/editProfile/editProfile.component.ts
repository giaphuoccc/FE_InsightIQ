import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
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
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './editProfile.component.html',
  styleUrls: ['./editProfile.component.css']
})
export class EditProfileComponent implements OnInit {
  // --- PROFILE SECTION ---
  userData: UserData = { name: 'Phuoc', email: 'Phuoc@gmail.com', phone: '0123456789' };
  userForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // --- NOTIFICATION MODAL ---
  notificationVisible = false;
  notificationMessage = '';

  // --- PASSWORD CHANGE SECTION ---
  isChangePasswordMode = false;
  passwordForm!: FormGroup;

  // Mock “current” password in your “database”
  private mockCurrentPassword = 'Phuo@1234';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserData();
    this.initPasswordForm();
  }

  /*** PROFILE FORM ***/
  initForm(): void {
    this.userForm = this.fb.group({
      name:    [this.userData.name, Validators.required],
      email:   [this.userData.email, [Validators.required, Validators.email]],
      phone:   [this.userData.phone, [
        Validators.required,
        // +84XXXXXXXXX or 0XXXXXXXXX where X is a valid VN mobile number
        Validators.pattern(/^(?:\+84|0)(?:3[2-9]|5[689]|7[06789]|8[1-9]|9[0-46-9])\d{7}$/)
      ]]
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
    // replace with real HTTP call when ready
    return of({ success: true, data: this.userData });
  }

  updateProfile(): void {
    if (this.userForm.invalid) {
      Object.values(this.formControls).forEach(c => c.markAsTouched());
      return;
    }
    this.isSubmitting = true;
    this.error = null;
    // simulate HTTP update
    of({ success: true, data: this.userForm.value, message: 'Profile updated successfully' })
      .subscribe(resp => {
        this.isSubmitting = false;
        if (resp.success) {
          this.userData = resp.data!;
          this.isEditMode = false;
          this.notificationMessage = resp.message!;
        } else {
          this.notificationMessage = resp.message || 'Failed to update profile';
          this.isEditMode = true;
        }
        this.notificationVisible = true;
      }, err => {
        this.isSubmitting = false;
        this.notificationMessage = 'Unable to update account information. Please try again later.';
        this.notificationVisible = true;
      });
  }

  editInformation() { this.isEditMode = true; this.initForm(); }
  cancelEdit()     { this.isEditMode = false; this.loadUserData(); }


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

  changePassword()   { this.isChangePasswordMode = true; }
  backToProfile()    { this.isChangePasswordMode = false; }
  closeNotification(){ this.notificationVisible = false; }

  submitPasswordChange(): void {
    const cur = this.passwordForm.get('currentPassword')!;
    const np  = this.passwordForm.get('newPassword')!;
    const m   = this.passwordForm.errors?.['mismatch'];

    // 1) wrong current password?
    if (cur.value !== this.mockCurrentPassword) {
      this.notificationMessage = 'Your current password is incorrect.';
      this.notificationVisible = true;
      return;
    }
    // 2) new password meets requirements?
    if (np.invalid) {
      this.notificationMessage =
        'Password must be ≥8 chars, include at least one digit and one special character.';
      this.notificationVisible = true;
      return;
    }
    // 3) mismatch?
    if (m) {
      this.notificationMessage = 'Passwords do not match.';
      this.notificationVisible = true;
      return;
    }

    // success!
    this.notificationMessage = 'Password changed successfully!';
    this.notificationVisible = true;
    this.isChangePasswordMode = false;
    // TODO: call your real change-password API here...
  }
}
