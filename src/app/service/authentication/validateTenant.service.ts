import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Raw shape returned by GET /tenant */
export interface TenantListRaw {
  id:    string;
  userId:      string;
  fullName:    string;
  companyName: string;
  taxId?:        string; 
  status:      'Approved' | 'Rejected' | 'Pending';
}

/** Shape returned by GET /user/:id */
export interface TenantUserDto {
  email:       string;
  phoneNumber: string;
}

/** The combined shape consumed by the list component */
export interface TenantListItem {
  tenantId:    string;
  userId:      string;
  name:        string;
  businessName:string;
  status:      'Approved' | 'Rejected' | 'Pending';
  email:       string;
  phone:       string;
  taxId?:        string; 
}

/** Detailed tenant for the detail page */
export interface TenantDetail {
  id:             string;
  userId:         string;
  fullName:       string;
  email:          string;
  phone:          string;
  companyName:    string;
  businessWebsite?: string;
  businessAddress?: string;
  taxId?:        string;
  businessSector?: string;
  profession?:     string;
  status:         'Approved' | 'Rejected' | 'Pending';
}

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private readonly baseUrl = 'http://localhost:3001';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /** Read JWT from cookie */
  private getAuthToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const match = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('auth_token='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  }

  /** Build headers with Bearer token */
  private withAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /** GET all tenants */
  getTenants(): Observable<TenantListRaw[]> {
    return this.http
      .get<TenantListRaw[]>(`${this.baseUrl}/tenant`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** GET user info by userId */
  getUser(userId: string): Observable<TenantUserDto> {
    return this.http
      .get<TenantUserDto>(`${this.baseUrl}/user/${userId}`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** GET one tenant by tenantId */
  getTenantById(tenantId: string): Observable<TenantDetail> {
    return this.http
      .get<TenantDetail>(`${this.baseUrl}/tenant/${tenantId}`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** PUT update status via /tenant/:tenantId */
  updateTenantStatus(
    tenantId: string,
    status: 'Pending' | 'Approved' | 'Rejected'
  ): Observable<void> {
    return this.http
      .put<void>(
        `${this.baseUrl}/tenant/${tenantId}`,
        { status },
        {
          headers: this.withAuthHeaders(),
          withCredentials: true
        }
      )
      .pipe(catchError(this.handleError));
  }

  /** Centralized error handler */
  private handleError(err: HttpErrorResponse): Observable<never> {
    const msg = err.error instanceof ErrorEvent
      ? `Client error: ${err.error.message}`
      : `Server error ${err.status}: ${err.message}`;
    console.error('SuperAdminService:', msg, err);
    return throwError(() => new Error(msg));
  }
}
