import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, switchMap, tap } from 'rxjs';

import {
  ProfileTenantService,
  UserDto,
  TenantDetail,
  MyTenantInfoIds
} from '../../../../core/profileTenant.service';

/* View-model for template – chỉ còn companyName & taxCode */
interface TenantData {
  /* personal */
  name:  string;
  email: string;
  phone: string;
  /* business */
  companyName: string;
  taxId:     string | null;
}

@Component({
  selector: 'app-profile-tenant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profileTE.component.html',
  styleUrls: ['./profileTE.component.css']
})
export class ProfileTEComponent implements OnInit {
  data: TenantData | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private profileTenantSvc: ProfileTenantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTenantData();
  }

  /* ------------ Load data ------------ */
  private loadTenantData(): void {
    this.isLoading = true;
    this.error = null;

    this.profileTenantSvc.getMyInfo().pipe(
        tap(raw => console.log('raw myInfo:', raw)),
        //tap(ids => console.log('Tenant IDs:', ids)),
        switchMap(({ tenantId, userId }: MyTenantInfoIds) =>
          forkJoin({
            tenant: this.profileTenantSvc.getTenant("1"),
            user:   this.profileTenantSvc.getUser(userId)

          })
        )
      )
      .subscribe({
        next: ({ user, tenant }) => {
          this.isLoading = false;
          this.data = this.mapToViewModel(user, tenant);


        },
        error: err => {
          this.isLoading = false;
          this.error =
            (err as { message?: string })?.message ??
            'Unable to load tenant information';
        }
      });
  }

  private mapToViewModel(user: UserDto, t: TenantDetail): TenantData {
    return {
      /* personal */
      name:  t.fullName ?? user.email.split('@')[0],
      email: user.email,
      phone: user.phoneNumber,
      /* business */
      companyName: t.companyName,
      taxId:     t.taxId ?? null
    };
  }

  /* ------------ Navigation ------------ */
  editInformation(): void {
    this.router.navigate(['/tenant-edit-profile'], { queryParams: { mode: 'edit' } });
  }

  changePassword(): void {
    this.router.navigate(['/tenant-edit-profile'], { queryParams: { mode: 'password' } });
  }
}
