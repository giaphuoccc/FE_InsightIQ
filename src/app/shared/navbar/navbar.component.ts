import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { NotificationComponent } from '../notification/notification.component';
import { HttpClient, HttpErrorResponse, HttpClientModule, HttpHeaders } from '@angular/common/http'; // Import HttpClient, HttpErrorResponse, HttpClientModule, HttpHeaders
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface UserInfoResponse {
  userId: number;
  email: string;
  role: string;
  tenantId?: number;
  superAdminId?: number;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NotificationComponent, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  showLogoutConfirm = false;
  showLogErorr = false;
  errorMessage = 'Logout Failed. Please try again later.';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  onSignOutClick() {
    this.showLogoutConfirm = true;
    this.showLogErorr = false;
  }

  confirmLogout() {
    this.authService.logout(); // Giả sử hàm logout này cũng xử lý việc xóa cookie hoặc thông báo cho backend
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  confirmErrorLogout() {
    this.showLogErorr = false;
  }

  onLogoClick(): void {
    const tenantApiUrl = 'http://localhost:3001/tenant/api/myInfo';
    const superAdminApiUrl = 'http://localhost:3001/superadmin/api/myInfo';

    // Tùy chọn cho HTTP request, bao gồm withCredentials
    const httpOptions = {
      withCredentials: true // <= THÊM DÒNG NÀY
    };

    const tenantRequest = this.http.get<UserInfoResponse>(tenantApiUrl, httpOptions).pipe( // <= SỬ DỤNG httpOptions
      catchError((error: HttpErrorResponse) => {
        console.warn('Tenant API call failed or user is not a tenant:', error.message);
        return of(null);
      })
    );

    const superAdminRequest = this.http.get<UserInfoResponse>(superAdminApiUrl, httpOptions).pipe( // <= SỬ DỤNG httpOptions
      catchError((error: HttpErrorResponse) => {
        console.warn('SuperAdmin API call failed or user is not a superadmin:', error.message);
        return of(null);
      })
    );

    forkJoin([tenantRequest, superAdminRequest]).subscribe(
      ([tenantResponse, superAdminResponse]) => {
        let navigated = false;
        if (tenantResponse && tenantResponse.role === 'TENANT') {
          console.log('User is TENANT, navigating to tenant dashboard.');
          this.router.navigate(['/dashboard_tenant']);
          navigated = true;
        } else if (superAdminResponse && superAdminResponse.role === 'SUPERADMIN') {
          console.log('User is SUPERADMIN, navigating to superadmin dashboard.');
          this.router.navigate(['/dashboard_superadmin']);
          navigated = true;
        }

        if (!navigated) {
          console.warn('Could not determine user role or role is not recognized from API responses.');
          // this.errorMessage = 'Unable to determine user role. Please try logging in again.';
          // this.showLogErorr = true;
        }
      },
      (error) => {
        console.error('Error in forkJoin while fetching user info:', error);
        this.errorMessage = 'An unexpected error occurred. Please try again later.';
        this.showLogErorr = true;
      }
    );
  }
}