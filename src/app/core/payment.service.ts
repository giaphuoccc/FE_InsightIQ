import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  InvoicePreview,
  PaymentResult,
  CurrentSubscription,
} from './subscription.model'; // Added CurrentSubscription
import { HttpClient } from '@angular/common/http';
import { SubscriptionService } from './subscription.service'; // Import SubscriptionService
import { switchMap, map, catchError } from 'rxjs/operators'; // Import operators

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // Inject HttpClient and SubscriptionService
  constructor(
    private http: HttpClient,
    private subscriptionService: SubscriptionService
  ) {}

  // Mock fetching invoice details for a *new* plan selection (Scenario 2) (Unchanged)
  getInvoicePreview(planId: string): Observable<InvoicePreview> {
    console.log(
      `PaymentService: Fetching invoice preview for NEW plan ${planId}...`
    );
    let preview: InvoicePreview;
    // (Switch logic remains the same as before)
    switch (planId) {
      case 'basic':
        preview = {
          planId: 'basic',
          planName: 'Basic',
          subtotal: 29,
          tax: 2.9,
          total: 31.9,
          currency: '$',
          billingCycle: 'Monthly',
          invoiceDescription: 'Starting Basic Plan',
        };
        break;
      case 'advanced':
        preview = {
          planId: 'advanced',
          planName: 'Advanced',
          subtotal: 99,
          tax: 9.9,
          total: 108.9,
          currency: '$',
          billingCycle: 'Monthly',
          invoiceDescription: 'Starting Advanced Plan',
        };
        break;
      case 'unlimited':
        preview = {
          planId: 'unlimited',
          planName: 'Unlimited',
          subtotal: 499,
          tax: 49.9,
          total: 548.9,
          currency: '$',
          billingCycle: 'Monthly',
          invoiceDescription: 'Starting Unlimited Plan',
        };
        break;
      case 'payg':
        preview = {
          planId: 'payg',
          planName: 'Pay-As-You-Go',
          subtotal: 0,
          tax: 0,
          total: 0,
          currency: '$',
          billingCycle: 'Per Use',
          invoiceDescription: 'Starting Pay-As-You-Go',
        };
        break;
      default:
        preview = {
          planId: 'unknown',
          planName: 'Unknown Plan',
          subtotal: 0,
          tax: 0,
          total: 0,
          currency: '$',
          billingCycle: 'N/A',
          invoiceDescription: 'Unknown Plan',
        };
        console.error(`No invoice preview found for planId: ${planId}`);
    }
    return of(preview).pipe(delay(400));
  }

  // ** NEW METHOD **
  // Mock fetching invoice details for the *current outstanding* invoice (Scenario 1)
  getOutstandingInvoicePreview(): Observable<InvoicePreview | null> {
    console.log(`PaymentService: Fetching OUTSTANDING invoice preview...`);
    // First, get the current subscription to know which invoice to fetch/mock
    return this.subscriptionService.getCurrentSubscription().pipe(
      switchMap((currentSub) => {
        if (
          currentSub &&
          this.subscriptionService.needsPayment(currentSub.status)
        ) {
          // Mock invoice based on the current subscription plan that needs payment
          const subtotal = currentSub.price;
          const tax = subtotal * 0.1; // Example tax rate
          const total = subtotal + tax;
          const invoiceDate = new Date(); // Or get from backend
          const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const description = `Invoice for ${currentSub.planName} Plan - ${
            monthNames[invoiceDate.getMonth()]
          } ${invoiceDate.getFullYear()}`;

          const preview: InvoicePreview = {
            planId: currentSub.planId,
            planName: currentSub.planName,
            subtotal: subtotal,
            tax: tax,
            total: total,
            currency: currentSub.currency,
            billingCycle: currentSub.billingCycle,
            invoiceDescription: description,
          };
          return of(preview).pipe(delay(400)); // Simulate network delay
        } else {
          // No payment needed or no active subscription
          console.log(
            'PaymentService: No outstanding invoice found or payment not needed.'
          );
          return of(null);
        }
      }),
      catchError((err) => {
        console.error(
          'Error fetching current subscription for outstanding invoice:',
          err
        );
        return of(null); // Return null on error
      })
    );
  }

  // Mock processing the payment (Handles both scenarios now)
  // In a real app, the backend would determine if it's a new sub or existing invoice payment
  processPayment(
    planId: string,
    isPayingExistingInvoice: boolean
  ): Observable<PaymentResult> {
    console.log(
      `PaymentService: Processing payment for plan ${planId}. Is existing invoice: ${isPayingExistingInvoice}`
    );
    // TODO: Replace with actual backend call
    // The backend endpoint might differ or take different parameters based on
    // whether it's a new subscription or paying an existing invoice.

    // Simulate success/failure (Unchanged)
    const success = Math.random() > 0.2;
    if (success) {
      console.log('PaymentService: Mock Payment Successful');
      const message = isPayingExistingInvoice
        ? 'Invoice paid successfully!'
        : 'Payment successful! Your subscription is active.';
      return of({
        success: true,
        message: message,
        transactionId: `txn_${Date.now()}`,
      }).pipe(delay(1500));
    } else {
      console.log('PaymentService: Mock Payment Failed');
      return of({
        success: false,
        message:
          'Payment failed. Please check your payment details or try again.',
      }).pipe(delay(1500));
    }
  }
}
