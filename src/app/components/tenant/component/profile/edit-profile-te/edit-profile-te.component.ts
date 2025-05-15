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
import { switchMap } from 'rxjs';

import {
  ProfileTenantService,
  MyTenantInfoIds
} from '../../../../../core/profileTenant.service';

@Component({
  selector: 'app-editProfileTenant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-profile-te.component.html',
  styleUrls: ['./edit-profile-te.component.css']
})
export class EditProfileTEComponent implements OnInit {
  /* ---------------- State ---------------- */
  userForm!: FormGroup;
  passwordForm!: FormGroup;

  isLoading = false;
  isEditMode           = false;
  isChangePasswordMode = false;
  isSubmitting         = false;
  error: string | null = null;

  notificationVisible = false;
  notificationMessage = '';
  /** true  = modal báo lỗi \n false = modal thành công */
  private modalError = false;
  private lastAction: 'edit' | 'password' | null = null;

  private tenantId!: string;
  private userId!:   string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private profileSvc: ProfileTenantService
  ) {}

  /* ---------------- Life-cycle ---------------- */
  ngOnInit(): void {
    this.profileSvc.getMyInfo().subscribe({
      next: ({ tenantId, userId }: MyTenantInfoIds) => {
        this.tenantId = tenantId.toString();
        this.userId   = userId.toString();

        this.initProfileForm();
        this.initPasswordForm();

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

  /* ---------------- Profile form ---------------- */
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
      ],
      companyName: ['', Validators.required],
      taxId: ['', Validators.required]
    });
  }
  get f() { return this.userForm.controls; }

  updateProfile(): void {
    if (this.userForm.invalid) {
      Object.values(this.f).forEach(c => c.markAsTouched());
      return;
    }
    this.isSubmitting = true;
    this.error = null;

    const { name, email, phone, companyName, taxId } = this.userForm.value;

    /* 1) update tenant */
    this.profileSvc.updateTenant({
      id: this.tenantId,
      fullName: name,
      companyName,
      taxId
    })
    /* 2) update user */
    .pipe(
      switchMap(() =>
        this.profileSvc.updateUser({
          id: this.userId,
          email,
          phoneNumber: phone
        })
      )
    )
    .subscribe({
      next: resp => {
        this.isSubmitting = false;
        this.notificationMessage = resp.message || 'Updated successfully';
        this.notificationVisible = true;
        this.modalError = false;            // ✅ success
        this.isEditMode = false;
        this.lastAction = 'edit';
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationMessage = 'Failed to update account information.';
        this.notificationVisible = true;
        this.modalError = true;             // ❌ error
        this.lastAction = 'edit';
      }
    });
  }

  editInformation(): void {
    this.isEditMode = true;
    this.isChangePasswordMode = false;
  }
  cancelEdit(): void {
    this.router.navigate(['/tenant-profile']);
  }

  /* ---------------- Password ---------------- */
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
  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  changePassword(): void {
    this.isChangePasswordMode = true;
    this.isEditMode = false;
  }
  backToProfile(): void {
    this.router.navigate(['/tenant-profile']);
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.notificationMessage = 'Please fix the highlighted errors.';
      this.notificationVisible = true;
      this.modalError = true;
      this.lastAction = 'password';
      return;
    }

    const curPw = this.passwordForm.get('currentPassword')!.value;
    const newPw = this.passwordForm.get('newPassword')!.value;

    this.profileSvc.getCurrentPassword(this.userId).subscribe({
      next: r => {
        const serverPw = r.password;
        if (curPw !== serverPw) {
          this.showPwError('Your current password is incorrect.');
          return;
        }
        if (newPw === serverPw) {
          this.showPwError('New password must be different from the current one.');
          return;
        }

        this.profileSvc.updatePassword(this.userId, newPw).subscribe({
          next: resp => {
            this.notificationMessage = resp.success
              ? 'Password changed successfully!'
              : resp.message || 'Failed to change password.';
            this.modalError = !resp.success;
            this.notificationVisible = true;
            this.isChangePasswordMode = !resp.success;
            this.lastAction = 'password';
          },
          error: () => this.showPwError('Unable to change password. Please try again later.')
        });
      },
      error: () => this.showPwError('Cannot verify current password. Try again later.')
    });
  }

  private showPwError(msg: string) {
    this.notificationMessage = msg;
    this.notificationVisible = true;
    this.modalError = true;
    this.lastAction = 'password';
  }

  /* ---------------- Modal ---------------- */
  onDone(): void {
    this.notificationVisible = false;

    if (!this.modalError) {
      // chỉ điều hướng khi không có lỗi
      this.router.navigate(['/tenant-profile']);
    }
  }
}
