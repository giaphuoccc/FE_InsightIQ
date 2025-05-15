// FrontEnd/core/feedback/feedback.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Rating } from '../chatBot/feedback.enum';

const API_BASE_URL = 'http://localhost:3001'; // Your backend URL

export interface FeedbackPayload {
  messageId: number;
  rating: Rating; // 'Positive' | 'Negative'
  comment?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  constructor(private http: HttpClient) {}

  submitFeedback(payload: FeedbackPayload): Observable<any> {
    return this.http
      .post<any>(`${API_BASE_URL}/feedback`, payload, { withCredentials: true })
      .pipe(
        catchError((error) => {
          console.error('Error submitting feedback:', error);
          // You can transform the error or just re-throw
          return throwError(
            () =>
              new Error(error.error?.message || 'Failed to submit feedback.')
          );
        })
      );
  }
}
