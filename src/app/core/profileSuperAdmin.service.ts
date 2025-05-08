import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

/** Only the IDs we care about */
export interface MyInfoIds {
  superAdminId: number | string;
  userId:       number | string;
}

export interface SuperAdminDto { id: string; username: string; }
export interface UserDto       { id: string; email: string; phoneNumber: string; }

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly API_BASE = 'http://localhost:3001';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  /* ─── Auth helper ───────────────────────────────────────── */
  private getAuthToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const pair = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('auth_token='));
    return pair ? decodeURIComponent(pair.split('=')[1]) : null;
  }

  private withAuthHeaders(): HttpHeaders {
    const t = this.getAuthToken();
    return t
      ? new HttpHeaders({ Authorization: `Bearer ${t}` })
      : new HttpHeaders();
  }

  /* ─── API calls ──────────────────────────────────────────── */
  getMyInfo() {
    return this.http.get<MyInfoIds>(
      `${this.API_BASE}/superadmin/api/myInfo`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  getSuperAdmin(id: string | number) {
    return this.http.get<SuperAdminDto>(
      `${this.API_BASE}/superadmin/${id}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  getUser(id: string | number) {
    return this.http.get<UserDto>(
      `${this.API_BASE}/user/${id}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /* ─── Password endpoints ─────────────────────────────────── */
  /** GET /user/password/:id → { password: string } */
  getCurrentPassword(userId: string | number) {
    return this.http.get<{ password: string }>(
      `${this.API_BASE}/user/password/${userId}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** POST /user/updatepassword body: { id, ppassword } */
  updatePassword(userId: string | number, password: string) {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.API_BASE}/user/updatepassword`,
      { id: userId, password },
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }
}
