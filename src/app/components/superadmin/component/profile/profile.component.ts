import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userData: UserData = {
    name: 'Phuoc',
    email: 'Phuoc@gmail.com',
    phone: '0123456789'
  };
  isLoading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading = true;
    this.error = null;
    this.getUserData().subscribe({
      next: resp => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.userData = resp.data;
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

  editInformation(): void {
    this.router.navigate(['/edit-profile'], { queryParams: { mode: 'edit' } });
  }

  changePassword(): void {
    this.router.navigate(['/edit-profile'], { queryParams: { mode: 'password' } });
  }
}
