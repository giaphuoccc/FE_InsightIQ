// src/app/core/services/billing.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { BillingHistoryItem, BillingHistoryDetail } from './subscription.model';
import { HttpClient } from '@angular/common/http'; // Import if making real API calls

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  // Mock data for billing history
  private mockHistory: BillingHistoryDetail[] = [
    {
      invoiceId: 'inv_12345',
      invoiceDate: '2025-03-15T10:00:00Z',
      planId: 'advanced',
      planName: 'Advanced',
      subtotal: 99,
      tax: 9.9,
      total: 108.9,
      currency: '$',
      billingCycle: 'Monthly',
      status: 'Paid',
      paymentDate: '2025-03-15T10:05:00Z',
      transactionId: 'txn_abc111',
      paymentMethodUsed: 'Visa **** 1234',
      invoiceDescription: 'Invoice for Advanced Plan - March 2025',
    },
    {
      invoiceId: 'inv_67890',
      invoiceDate: '2025-02-15T09:00:00Z',
      planId: 'advanced',
      planName: 'Advanced',
      subtotal: 99,
      tax: 9.9,
      total: 108.9,
      currency: '$',
      billingCycle: 'Monthly',
      status: 'Paid',
      paymentDate: '2025-02-15T09:02:00Z',
      transactionId: 'txn_def222',
      paymentMethodUsed: 'Visa **** 1234',
      invoiceDescription: 'Invoice for Advanced Plan - February 2025',
    },
    {
      invoiceId: 'inv_11223',
      invoiceDate: '2025-01-15T08:00:00Z',
      planId: 'basic',
      planName: 'Basic',
      subtotal: 29,
      tax: 2.9,
      total: 31.9,
      currency: '$',
      billingCycle: 'Monthly',
      status: 'Paid',
      paymentDate: '2025-01-15T08:01:00Z',
      transactionId: 'txn_ghi333',
      paymentMethodUsed: 'Mastercard **** 5678',
      invoiceDescription: 'Invoice for Basic Plan - January 2025',
    },
    {
      invoiceId: 'inv_44556',
      invoiceDate: '2025-04-15T11:00:00Z',
      planId: 'advanced',
      planName: 'Advanced',
      subtotal: 99,
      tax: 9.9,
      total: 108.9,
      currency: '$',
      billingCycle: 'Monthly',
      status: 'Failed',
      paymentDate: undefined,
      transactionId: 'txn_jkl444_fail',
      paymentMethodUsed: 'Visa **** 1234',
      invoiceDescription:
        'Invoice for Advanced Plan - April 2025 (Failed Attempt)',
    },
  ];

  constructor(private http: HttpClient) {} // Inject HttpClient for real calls later

  /**
   * Fetches the list of billing history items.
   * @returns Observable<BillingHistoryItem[]>
   */
  getBillingHistory(): Observable<BillingHistoryItem[]> {
    console.log('BillingService: Fetching billing history list...');
    // TODO: Replace with actual API call: return this.http.get<BillingHistoryItem[]>('/api/billing/history');

    // Map full mock details to the summary item structure
    const historySummary = this.mockHistory.map((detail) => ({
      invoiceId: detail.invoiceId,
      invoiceDate: detail.invoiceDate,
      planName: detail.planName,
      totalAmount: detail.total,
      currency: detail.currency,
      status: detail.status,
      paymentMethod: detail.paymentMethodUsed, // Map if needed in the list view
    }));

    return of(historySummary).pipe(delay(600)); // Simulate network delay
  }

  /**
   * Fetches the details for a specific invoice.
   * @param invoiceId The ID of the invoice to fetch.
   * @returns Observable<BillingHistoryDetail | null> Null if not found.
   */
  getInvoiceDetail(invoiceId: string): Observable<BillingHistoryDetail | null> {
    console.log(`BillingService: Fetching details for invoice ${invoiceId}...`);
    // TODO: Replace with actual API call: return this.http.get<BillingHistoryDetail | null>(`/api/billing/history/${invoiceId}`);

    const foundInvoice = this.mockHistory.find(
      (inv) => inv.invoiceId === invoiceId
    );
    return of(foundInvoice || null).pipe(delay(400)); // Simulate network delay
  }
}
