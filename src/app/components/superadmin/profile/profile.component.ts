import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, switchMap, tap } from 'rxjs';

import {
  ProfileService,
  SuperAdminDto,
  UserDto,
  MyInfoIds
} from '../../../core/profileSuperAdmin.service';

/* View-model cho template */
interface UserData {
  name:  string;  // username (superadmin)
  email: string;  // email (/user)
  phone: string;  // phoneNumber (/user)
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userData: UserData | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private profileSvc: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  /* ---------- Load dữ liệu ---------- */
  private loadUserData(): void {
    this.isLoading = true;
    this.error = null;

    this.profileSvc.getMyInfo()
      .pipe(
        tap(ids => console.log('IDs:', ids)),             // <- xem superAdminId & userId
        switchMap(({ superAdminId, userId }: MyInfoIds) =>
          forkJoin({
            superadmin: this.profileSvc.getSuperAdmin(superAdminId),
            user:       this.profileSvc.getUser(userId)
          })
        )
      )
      .subscribe({
        next: ({ superadmin, user }) => {
          this.isLoading = false;
          this.userData  = this.mapToViewModel(superadmin, user);
        },
        error: err => {
          this.isLoading = false;
          this.error =
            (err as { message?: string })?.message ??
            'An error occurred while loading user data';
        }
      });
  }

  private mapToViewModel(
    sa: SuperAdminDto,
    user: UserDto
  ): UserData {
    return {
      name:  sa.username,
      email: user.email,
      phone: user.phoneNumber
    };
  }

  /* ---------- Navigation ---------- */
  editInformation(): void {
    this.router.navigate(['/edit-profile'], { queryParams: { mode: 'edit' } });
  }

  changePassword(): void {
    this.router.navigate(['/edit-profile'], { queryParams: { mode: 'password' } });
  }
}
