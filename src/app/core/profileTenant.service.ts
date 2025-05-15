// src/app/core/profileTenant.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/* ─── DTOs ──────────────────────────────────────────────── */

export interface MyTenantInfoIds {
  tenantId: number | string;
  userId:   number | string;
}

export interface UserDto {
  id: string;
  email: string;
  phoneNumber: string;
}

/** Business detail returned by GET /tenant/:id */
export interface TenantDetail {
  id:              string;
  fullName:        string;
  companyName:     string;
  taxId:         string | null
}

/** Payloads for update calls (extend as needed) */
interface UpdateTenantPayload {
  id: number | string;
  fullName:        string;
  companyName?: string;
  taxId?: string;
}

interface UpdateUserPayload {
  id: number | string;
  email: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileTenantService {
  private readonly API_BASE = 'http://localhost:3001';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /* ── Auth helpers (same as SA service) ── */
  private getAuthToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const pair = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('auth_token='));
    return pair ? decodeURIComponent(pair.split('=')[1]) : null;
  }

  private withAuthHeaders(): HttpHeaders {
    const t = this.getAuthToken();
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` })
             : new HttpHeaders();
  }

  /* ── Public API calls ─────────────────── */

    // lấy IDs
    getMyInfo() {
    return this.http.get<MyTenantInfoIds>(
        `${this.API_BASE}/tenant/api/myInfo`,   // đảm bảo không gõ nhầm appi
        { headers: this.withAuthHeaders(), withCredentials: true }
    );
    }

    // lấy business detail
    getTenant(id: string | number) {
    return this.http.get<TenantDetail>(
        `${this.API_BASE}/tenant/${id}`,
        { headers: this.withAuthHeaders(), withCredentials: true }
    );
    }

    // lấy user account
    getUser(id: string | number) {
    return this.http.get<UserDto>(
        `${this.API_BASE}/user/${id}`,
        { headers: this.withAuthHeaders(), withCredentials: true }
    );
    }



  /* ---------- Updates ---------- */

  /** Update tenant business info */
  updateTenant(payload: UpdateTenantPayload): Observable<{ success: boolean; message?: string }> {
    return this.http.put<{ success: boolean; message?: string }>(
      `${this.API_BASE}/tenant/${payload.id}`,
      payload,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** Update user’s email / phone */
  updateUser(payload: UpdateUserPayload): Observable<{ success: boolean; message?: string }> {
    return this.http.put<{ success: boolean; message?: string }>(
      `${this.API_BASE}/user/${payload.id}`,
      payload,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** Get current password */
  getCurrentPassword(userId: string|number) {
    return this.http.get<{ password: string }>(
      `${this.API_BASE}/user/password/${userId}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** Change password */
  updatePassword(userId: string | number, password: string) {
    return this.http.put<{ success: boolean; message?: string }>(
      `${this.API_BASE}/user/updatepassword/${userId}`,
      { password },
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

}
