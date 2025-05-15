import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import {
  ProfileService,
  MyInfoIds,
} from '../../../service/profileSuperAdmin.service';

@Component({
  selector: 'app-editProfile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './editProfile.component.html',
  styleUrls: ['./editProfile.component.css'],
})
export class EditProfileComponent implements OnInit {
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  isChangePasswordMode = false;
  isSubmitting = false;
  error: string | null = null;

  notificationVisible = false;
  notificationMessage = '';
  private lastAction: 'edit' | 'password' | null = null;

  private userId!: string;
  private superAdminId!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private profileSvc: ProfileService
  ) {}

  ngOnInit(): void {
    this.profileSvc.getMyInfo().subscribe({
      next: ({ superAdminId, userId }: MyInfoIds) => {
        this.superAdminId = superAdminId.toString();
        this.userId = userId.toString();

        this.initProfileForm();
        this.initPasswordForm();

        this.route.queryParams.subscribe((p) => {
          if (p['mode'] === 'edit') {
            this.lastAction = 'edit';
            this.editInformation();
          } else if (p['mode'] === 'password') {
            this.lastAction = 'password';
            this.changePassword();
          }
        });
      },
      error: (err) => {
        this.error = (err as any).message || 'Cannot fetch user info';
      },
    });
  }

  private initProfileForm(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?:\+84|0)(?:3[2-9]|5[689]|7[06789]|8[1-9]|9[0-46-9])\d{7}$/
          ),
        ],
      ],
    });
  }
  get f() {
    return this.userForm.controls;
  }

  updateProfile(): void {
    if (this.userForm.invalid) {
      Object.values(this.f).forEach((c) => c.markAsTouched());
      return;
    }
    this.isSubmitting = true;
    this.error = null;

    const { name, email, phone } = this.userForm.value;

    // 1) Cập nhật username ở SuperAdmin
    this.profileSvc
      .updateSuperAdmin({ id: this.superAdminId, username: name })
      .pipe(
        // 2) Sau khi xong, cập nhật email & phone ở User
        switchMap(() =>
          this.profileSvc.updateUser({
            id: this.userId,
            email,
            phoneNumber: phone,
          })
        )
      )
      .subscribe({
        next: (resp) => {
          this.isSubmitting = false;
          const msg = resp.message || 'Updated successfully';
          this.notificationMessage = msg;
          this.notificationVisible = true;
          this.isEditMode = false;
          this.lastAction = 'edit';
        },
        error: () => {
          this.isSubmitting = false;
          this.notificationMessage = 'Failed to update account information.';
          this.notificationVisible = true;
          this.lastAction = 'edit';
        },
      });
  }

  editInformation(): void {
    this.isEditMode = true;
    this.isChangePasswordMode = false;
  }

  cancelEdit(): void {
    this.router.navigate(['/profile'], { queryParams: { id: this.userId } });
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/(?=.*\d)(?=.*[!@#$%^&*])/),
          ],
        ],
        confirmPassword: ['', Validators.required],
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

    this.profileSvc.getCurrentPassword(this.userId).subscribe({
      next: (r) => {
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

        this.profileSvc.updatePassword(this.userId, newPw).subscribe({
          next: (resp) => {
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
          },
        });
      },
      error: () => {
        this.notificationMessage =
          'Cannot verify current password. Try again later.';
        this.notificationVisible = true;
        this.lastAction = 'password';
      },
    });
  }

  onDone(): void {
    this.notificationVisible = false;
    this.router.navigate(['/profile'], { queryParams: { id: this.userId } });
  }
}
