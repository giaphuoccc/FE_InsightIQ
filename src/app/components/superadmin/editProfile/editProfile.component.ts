import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ProfileService,
  MyInfoIds
} from '../../../core/profileSuperAdmin.service';

@Component({
  selector: 'app-editProfile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './editProfile.component.html',
  styleUrls: ['./editProfile.component.css']
})
export class EditProfileComponent implements OnInit {
  /* ── FORM & STATE ───────────────────────────────────────── */
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  isEditMode           = false;
  isChangePasswordMode = false;
  isSubmitting         = false;
  error: string | null = null;

  /* ── NOTIFICATION MODAL ─────────────────────────────────── */
  notificationVisible = false;
  notificationMessage = '';
  private lastAction: 'edit' | 'password' | null = null;

  /* ── INTERNAL ───────────────────────────────────────────── */
  private userId!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private profileSvc: ProfileService
  ) {}

  ngOnInit(): void {
    // 1️⃣  Fetch IDs
    this.profileSvc.getMyInfo().subscribe({
      next: (ids: MyInfoIds) => {
        this.userId = ids.userId.toString();

        // 2️⃣  Init forms
        this.initProfileForm();
        this.initPasswordForm();

        // 3️⃣  Listen for ?mode=edit or ?mode=password
        this.route.queryParams.subscribe(p => {
          if (p['mode'] === 'edit') {
            this.lastAction = 'edit';
            this.editInformation();
          } else if (p['mode'] === 'password') {
            this.lastAction = 'password';
            this.changePassword();
          }
        });
      },
      error: err => {
        this.error = (err as any).message || 'Cannot fetch user info';
      }
    });
  }

  /* ── PROFILE FORM ───────────────────────────────────────── */
  private initProfileForm(): void {
    this.userForm = this.fb.group({
      name:  ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?:\+84|0)(?:3[2-9]|5[689]|7[06789]|8[1-9]|9[0-46-9])\d{7}$/
          )
        ]
      ]
    });
  }
  get f() {
    return this.userForm.controls;
  }

  updateProfile(): void {
    if (this.userForm.invalid) {
      Object.values(this.f).forEach(c => c.markAsTouched());
      return;
    }
    this.isSubmitting = true;
    this.error = null;

    // Mock save
    setTimeout(() => {
      this.isSubmitting = false;
      this.isEditMode = false;
      this.notificationMessage = 'Profile updated successfully (mock).';
      this.notificationVisible = true;
      this.lastAction = 'edit';
    }, 800);
  }

  editInformation(): void {
    this.isEditMode = true;
    this.isChangePasswordMode = false;
  }

  cancelEdit(): void {
    // Navigate back to profile view
    this.router.navigate(['/profile'], { queryParams: { id: this.userId } });
  }

  /* ── PASSWORD FORM ───────────────────────────────────────── */
  private initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/(?=.*\d)(?=.*[!@#$%^&*])/)
          ]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(f: FormGroup) {
    return f.get('newPassword')?.value === f.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  changePassword(): void {
    this.isChangePasswordMode = true;
    this.isEditMode = false;
  }

  backToProfile(): void {
    this.router.navigate(['/profile'], { queryParams: { id: this.userId } });
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.notificationMessage = 'Please fix the highlighted errors.';
      this.notificationVisible = true;
      this.lastAction = 'password';
      return;
    }

    const curPw = this.passwordForm.get('currentPassword')!.value;
    const newPw = this.passwordForm.get('newPassword')!.value;

    // 1️⃣  Fetch current password from backend
    this.profileSvc.getCurrentPassword(this.userId).subscribe({
      next: r => {
        const serverPw = r.password;
        if (curPw !== serverPw) {
          this.notificationMessage = 'Your current password is incorrect.';
          this.notificationVisible = true;
          this.lastAction = 'password';
          return;
        }
        if (newPw === serverPw) {
          this.notificationMessage =
            'New password must be different from the current one.';
          this.notificationVisible = true;
          this.lastAction = 'password';
          return;
        }

        // 2️⃣  Call change-password API
        this.profileSvc.updatePassword(this.userId, newPw).subscribe({
          next: resp => {
            this.notificationMessage = resp.success
              ? 'Password changed successfully!'
              : resp.message || 'Failed to change password.';
            this.notificationVisible = true;
            this.isChangePasswordMode = !resp.success;
            this.lastAction = 'password';
          },
          error: () => {
            this.notificationMessage =
              'Unable to change password. Please try again later.';
            this.notificationVisible = true;
            this.lastAction = 'password';
          }
        });
      },
      error: () => {
        this.notificationMessage =
          'Cannot verify current password. Try again later.';
        this.notificationVisible = true;
        this.lastAction = 'password';
      }
    });
  }

  /* ── MODAL “DONE / ✕” ─────────────────────────────────────── */
  onDone(): void {
    this.notificationVisible = false;
    this.router.navigate(['/profile'], { queryParams: { id: this.userId } });
  }
}
