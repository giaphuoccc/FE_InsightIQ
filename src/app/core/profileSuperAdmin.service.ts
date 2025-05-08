import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export interface MyInfoIds {
  superAdminId: number | string;
  userId:       number | string;
}
export interface SuperAdminDto { id: string; username: string; }
export interface UserDto       { id: string; email: string; phoneNumber: string; }

/** Payload cho update username */
interface UpdateSuperAdminPayload {
  id: number | string;
  username: string;
}
/** Payload cho update user info */
interface UpdateUserPayload {
  id: number | string;
  email: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly API_BASE = 'http://localhost:3001';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

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

  getMyInfo() {
    return this.http.get<MyInfoIds>(
      `${this.API_BASE}/superadmin/api/myInfo`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  getSuperAdmin(id: string|number) {
    return this.http.get<SuperAdminDto>(
      `${this.API_BASE}/superadmin/${id}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  getUser(id: string|number) {
    return this.http.get<UserDto>(
      `${this.API_BASE}/user/${id}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  getCurrentPassword(userId: string|number) {
    return this.http.get<{ password: string }>(
      `${this.API_BASE}/user/password/${userId}`,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  updatePassword(userId: string|number, newPassword: string) {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.API_BASE}/user/updatepassword`,
      { id: userId, newPassword },
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** NEW: Cập nhật username superadmin */
  updateSuperAdmin(payload: UpdateSuperAdminPayload): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.API_BASE}/superadmin/update`,
      payload,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }

  /** NEW: Cập nhật email & phoneNumber của user */
  updateUser(payload: UpdateUserPayload): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.API_BASE}/user/update`,
      payload,
      { headers: this.withAuthHeaders(), withCredentials: true }
    );
  }
}
