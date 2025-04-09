// src/app/core/tenant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// Import 'of' and 'throwError' for creating Observables from mock data/errors
// Import 'delay' to simulate network latency (optional)
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators'; // Add 'delay'

// Interface for items in the tenant list (same as before)
export interface TenantListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}

// Interface for detailed tenant data (same as before)
export interface TenantDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessWebsite?: string;
  businessAddress?: string;
  taxCode?: string;
  businessSector?: string;
  profession?: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  // Keep apiUrl and HttpClient for other methods or future use
  private apiUrl = 'http://localhost:3000/api/tenants';

  // --- MOCK DATA ---
  // Use the structure from your previous PendingTenantComponent hardcoded data
  private mockTenants: TenantListItem[] = [
    {
      id: 't1',
      name: 'Alice Wonderland',
      email: 'alice@example.com',
      phone: '123-456-7890',
      businessName: 'Wonderland Inc.',
      status: 'Pending',
    },
    {
      id: 't2',
      name: 'Bob The Builder',
      email: 'bob@example.com',
      phone: '234-567-8901',
      businessName: 'Builders Co.',
      status: 'Approved',
    },
    {
      id: 't3',
      name: 'Charlie Chaplin',
      email: 'charlie@example.com',
      phone: '345-678-9012',
      businessName: 'Comedy Films',
      status: 'Rejected',
    },
    {
      id: 't4',
      name: 'Diana Prince',
      email: 'diana@example.com',
      phone: '456-789-0123',
      businessName: 'Themyscira Exports',
      status: 'Pending',
    },
  ];

  // Add some mock detail data (can be the same or more detailed)
  private mockTenantDetails: TenantDetail[] = [
    {
      id: 't1',
      name: 'Alice Wonderland',
      email: 'alice@example.com',
      phone: '123-456-7890',
      businessName: 'Wonderland Inc.',
      businessAddress: '1 Rabbit Hole',
      taxCode: 'ABC',
      status: 'Pending',
    },
    {
      id: 't2',
      name: 'Bob The Builder',
      email: 'bob@example.com',
      phone: '234-567-8901',
      businessName: 'Builders Co.',
      businessAddress: '2 Fixit Lane',
      taxCode: 'DEF',
      status: 'Approved',
    },
    {
      id: 't3',
      name: 'Charlie Chaplin',
      email: 'charlie@example.com',
      phone: '345-678-9012',
      businessName: 'Comedy Films',
      businessAddress: '3 Tramp St',
      taxCode: 'GHI',
      status: 'Rejected',
    },
    {
      id: 't4',
      name: 'Diana Prince',
      email: 'diana@example.com',
      phone: '456-789-0123',
      businessName: 'Themyscira Exports',
      businessAddress: '4 Amazon Way',
      taxCode: 'JKL',
      status: 'Pending',
    },
  ];
  // --- END MOCK DATA ---

  constructor(private http: HttpClient) {}

  // --- Get all tenants (MOCKED) ---
  getTenants(): Observable<TenantListItem[]> {
    console.log(`TenantService: Returning MOCKED tenant list.`);
    // Use 'of' to return the mock data array as an Observable
    // Add 'delay' to simulate network latency (e.g., 500ms)
    return of(this.mockTenants).pipe(
      delay(500) // Simulate half-second delay
    );
    // --- Comment out the real HTTP call ---
    // return this.http.get<TenantListItem[]>(this.apiUrl).pipe(
    //   catchError(this.handleError)
    // );
  }

  // --- Get single tenant by ID (MOCKED) ---
  getTenantById(id: string): Observable<TenantDetail> {
    console.log(`TenantService: Finding MOCKED tenant with ID: ${id}`);
    // Find the tenant in the mock details array
    const foundTenant = this.mockTenantDetails.find(
      (tenant) => tenant.id === id
    );

    if (foundTenant) {
      // If found, return it using 'of' with a delay
      return of(foundTenant).pipe(
        delay(300) // Simulate slightly faster delay for single item
      );
    } else {
      // If not found, return an error Observable
      return throwError(
        () => new Error(`Mock Tenant with ID ${id} not found`)
      ).pipe(
        // You might need to catch and handle this specific error differently
        // than a real HttpErrorResponse in the component, or use delay here too.
        delay(100) // Simulate quick error response
      );
    }
    // --- Comment out the real HTTP call ---
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<TenantDetail>(url).pipe(
    //   catchError(this.handleError)
    // );
  }

  // --- Approve tenant (Not Mocked - Optional) ---
  // You could also mock this to update the mock data array if needed
  approveTenant(id: string): Observable<void> {
    // For now, keep the real call or comment it out if not testing this flow
    const url = `${this.apiUrl}/${id}/approve`;
    console.log(
      `TenantService: Approving tenant at ${url} (using real http call)`
    );
    return this.http.put<void>(url, {}).pipe(catchError(this.handleError));
    // Mocked version example:
    // const tenantIndex = this.mockTenantDetails.findIndex(t => t.id === id);
    // if (tenantIndex > -1) {
    //   this.mockTenantDetails[tenantIndex].status = 'Approved';
    //   const listItemIndex = this.mockTenants.findIndex(t => t.id === id);
    //   if (listItemIndex > -1) this.mockTenants[listItemIndex].status = 'Approved';
    //   return of(void 0).pipe(delay(200)); // Return Observable<void>
    // } else {
    //   return throwError(() => new Error(`Mock Tenant with ID ${id} not found for approval`)).pipe(delay(100));
    // }
  }

  // --- Reject tenant (Not Mocked - Optional) ---
  // Similar to approveTenant, keep real call or mock if needed
  rejectTenant(id: string): Observable<void> {
    const url = `${this.apiUrl}/${id}/reject`;
    console.log(
      `TenantService: Rejecting tenant at ${url} (using real http call)`
    );
    return this.http.put<void>(url, {}).pipe(catchError(this.handleError));
    // Mocked version example:
    // const tenantIndex = this.mockTenantDetails.findIndex(t => t.id === id);
    // if (tenantIndex > -1) {
    //    this.mockTenantDetails[tenantIndex].status = 'Rejected';
    //    const listItemIndex = this.mockTenants.findIndex(t => t.id === id);
    //    if (listItemIndex > -1) this.mockTenants[listItemIndex].status = 'Rejected';
    //    return of(void 0).pipe(delay(200));
    // } else {
    //    return throwError(() => new Error(`Mock Tenant with ID ${id} not found for rejection`)).pipe(delay(100));
    // }
  }

  // Centralized Error Handling (keep for non-mocked methods)
  private handleError(error: HttpErrorResponse): Observable<never> {
    // ... (error handling logic remains the same)
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: Code ${error.status}, Message: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += ` - ${error.error}`;
      }
    }
    console.error('TenantService Error Handler:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
