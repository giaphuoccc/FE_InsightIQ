import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// --- Interfaces matching the real API responses ---

/** Rating summary from /feedback/summary/countRatings */
export interface RatingSummary {
  positive: number;
  negative: number;
}

/** A single feedback item from /feedback or /feedback/summary/allFeedbacks/:tenantId */
export interface FeedbackItem {
  comment:   string;
  messageId: number;
}

/** Tenant info from /tenant/api/myInfo */
interface TenantInfo {
  tenantId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly base = 'http://localhost:3001';

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

  /** SUPERADMIN → { positive, negative } */
  getRatingSummary(): Observable<RatingSummary> {
    return this.http
      .get<RatingSummary>(`${this.base}/feedback/summary/countRatings`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** SUPERADMIN → FeedbackItem[] */
  getAllFeedbacks(): Observable<FeedbackItem[]> {
    return this.http
      .get<FeedbackItem[]>(`${this.base}/feedback`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** TENANT → { tenantId } */
  getTenantInfo(): Observable<TenantInfo> {
    return this.http
      .get<TenantInfo>(`${this.base}/tenant/api/myInfo`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** TENANT → { positive, negative } */
  getTenantRatingSummary(tenantId: string): Observable<RatingSummary> {
    return this.http
      .get<RatingSummary>(`${this.base}/feedback/summary/countRatings/${tenantId}`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** TENANT → FeedbackItem[] */
  getTenantFeedbacks(tenantId: string): Observable<FeedbackItem[]> {
    return this.http
      .get<FeedbackItem[]>(`${this.base}/feedback/summary/allFeedbacks/${tenantId}`, {
        headers: this.withAuthHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** Centralized error handler */
  private handleError(err: HttpErrorResponse): Observable<never> {
    const msg = err.error instanceof ErrorEvent
      ? `Client error: ${err.error.message}`
      : `Server error ${err.status}: ${err.message}`;
    console.error('ReportService:', msg);
    return throwError(() => new Error(msg));
  }
}
