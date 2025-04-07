import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs'; // Import 'of' and 'timer' for simulation
import { catchError, map, delay } from 'rxjs/operators'; // Import 'delay'

// Define a more detailed interface for a single tenant
export interface TenantDetail {
  id: string; // Crucial for fetching
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessWebsite?: string; // Optional fields
  businessAddress?: string;
  taxCode?: string;
  businessSector?: string;
  profession?: string;
  status: 'Approved' | 'Rejected' | 'Pending'; // Keep status if needed
  // Add any other relevant fields
}

// Mock Data (replace with actual API calls)
const MOCK_TENANTS: TenantDetail[] = [
  {
    id: 't1',
    name: 'John Doe',
    email: 'abc123@gmail.com',
    phone: '0903331312',
    businessName: 'ABC Group',
    status: 'Pending',
    businessWebsite: 'abcgroup.com',
    businessAddress: '123 Main St',
    taxCode: '0123123123',
    businessSector: 'Technology',
    profession: 'Business',
  },
  {
    id: 't2',
    name: 'Alice Smith',
    email: 'alice.smith@abc.com',
    phone: '0912345678',
    businessName: 'TechPro Solutions',
    status: 'Pending',
    businessWebsite: 'techpro.io',
    businessAddress: '456 Tech Ave',
    taxCode: '9876543210',
    businessSector: 'IT Services',
    profession: 'Consultant',
  },
  {
    id: 't3',
    name: 'Emily Tran',
    email: 'emily.tran@yahoo.com',
    phone: '0987654321',
    businessName: "Tran's Boutique",
    status: 'Pending',
    businessWebsite: 'transboutique.com',
    businessAddress: '789 Fashion Blvd',
    taxCode: '1122334455',
    businessSector: 'Retail',
    profession: 'Owner',
  },
  // Add more mock tenants corresponding to your list data...
];

@Injectable({
  providedIn: 'root', // Singleton service
})
export class TenantService {
  // Replace with your actual API base URL
  private apiUrl = '/api/tenants'; // Example API endpoint

  constructor(private http: HttpClient) {}

  /**
   * Get Tenant Details by ID
   * Simulates an API call with delay and potential error
   */
  getTenantById(id: string): Observable<TenantDetail> {
    console.log(`TenantService: Fetching tenant with id: ${id}`);

    // --- SIMULATION LOGIC --- (Replace with real HTTP call)
    const tenant = MOCK_TENANTS.find((t) => t.id === id);

    // Simulate network delay
    const delayTime = 500; // 0.5 seconds

    if (id === 'trigger-error') {
      // Simulate an error for a specific ID
      return timer(delayTime).pipe(
        map(() => {
          throw new HttpErrorResponse({
            status: 500,
            statusText: 'Simulated Server Error',
            error: 'Failed to load tenant intentionally.',
          });
        }),
        catchError(this.handleError) // Use shared error handler
      );
    }

    if (tenant) {
      // Return tenant data as an Observable after a delay
      return of(tenant).pipe(delay(delayTime));
    } else {
      // Simulate not found error after a delay
      return timer(delayTime).pipe(
        map(() => {
          throw new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: `Tenant with ID ${id} not found.`,
          });
        }),
        catchError(this.handleError) // Use shared error handler
      );
    }
    // --- END SIMULATION ---

    /* --- REAL HTTP Call (Example) ---
    return this.http.get<TenantDetail>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError) // Use shared error handler
    );
    */
  }

  // Add methods for Approve/Reject (implement actual API calls)
  approveTenant(id: string): Observable<any> {
    console.log(`TenantService: Approving tenant ${id}`);
    // return this.http.post(`${this.apiUrl}/${id}/approve`, {});
    return of({ message: 'Tenant approved successfully' }).pipe(delay(300)); // Simulated success
  }

  rejectTenant(id: string): Observable<any> {
    console.log(`TenantService: Rejecting tenant ${id}`);
    // return this.http.post(`${this.apiUrl}/${id}/reject`, {});
    return of({ message: 'Tenant rejected successfully' }).pipe(delay(300)); // Simulated success
  }

  /**
   * Basic Error Handling
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (
        error.error &&
        typeof error.error === 'object' &&
        error.error.message
      ) {
        errorMessage += `\nDetails: ${error.error.message}`;
      }
    }
    console.error('API Error:', error);
    // Return an observable with a user-facing error message
    // The component will subscribe to this and handle the error display
    return throwError(() => new Error(errorMessage));
  }
}
