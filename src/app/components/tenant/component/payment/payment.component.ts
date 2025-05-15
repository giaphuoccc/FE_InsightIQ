import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'; // Import NavigationEnd
import { Subscription, Observable, Subject, switchMap, of, filter } from 'rxjs'; // Import filter
import { takeUntil, catchError } from 'rxjs/operators';
import {
  InvoicePreview,
  PaymentResult,
} from '../../../../service/payment/subscription.model';
import { PaymentService } from '../../../../service/payment/payment.service';
import { CommonModule, NgIf, AsyncPipe } from '@angular/common'; // Import NgIf, AsyncPipe

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class PaymentComponent implements OnInit, OnDestroy {
  invoicePreview$: Observable<InvoicePreview | null>;
  isLoadingInvoice = false;
  isProcessingPayment = false;
  error: string | null = null;
  selectedPlanId: string | null = null; // Only relevant for Scenario 2
  isPayingExistingInvoice = false; // Flag to know which scenario we are in
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {
    this.invoicePreview$ = of(null); // Initialize
  }

  ngOnInit(): void {
    this.loadInvoiceData();

    // Optional: Re-load data if route changes but component is reused
    // (e.g., navigating from /pay/basic to /pay/advanced)
    // This might not be needed depending on your exact routing strategy
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Check if the route still matches this component's expected routes
        // This logic might need refinement based on your app structure
        if (
          this.route.snapshot.routeConfig?.path === 'pay/:planId' ||
          this.route.snapshot.routeConfig?.path === 'pay-invoice'
        ) {
          console.log(
            'PaymentComponent: Route changed, reloading invoice data.'
          );
          this.loadInvoiceData();
        }
      });
  }

  loadInvoiceData(): void {
    this.isLoadingInvoice = true;
    this.error = null; // Clear previous errors on load
    this.selectedPlanId = null; // Reset planId
    this.isPayingExistingInvoice = false; // Reset flag

    // Check if planId parameter exists (Scenario 2)
    if (this.route.snapshot.paramMap.has('planId')) {
      this.selectedPlanId = this.route.snapshot.paramMap.get('planId');
      console.log(
        `PaymentComponent: Loading invoice preview for NEW plan ${this.selectedPlanId}`
      );
      if (!this.selectedPlanId) {
        // Should not happen if .has is true, but safety check
        this.handleLoadError('Invalid plan selected.');
        return;
      }
      this.isPayingExistingInvoice = false;
      this.invoicePreview$ = this.paymentService
        .getInvoicePreview(this.selectedPlanId)
        .pipe(
          takeUntil(this.destroy$),
          catchError((err) => {
            console.error('Error fetching new plan invoice preview:', err);
            this.handleLoadError(
              'Could not load billing details for the selected plan.'
            );
            return of(null);
          })
        );
    }
    // Check if it's the route for paying existing invoice (Scenario 1)
    else if (this.route.snapshot.routeConfig?.path === 'pay-invoice') {
      console.log(
        `PaymentComponent: Loading invoice preview for OUTSTANDING invoice`
      );
      this.isPayingExistingInvoice = true;
      this.invoicePreview$ = this.paymentService
        .getOutstandingInvoicePreview()
        .pipe(
          takeUntil(this.destroy$),
          catchError((err) => {
            console.error('Error fetching outstanding invoice preview:', err);
            this.handleLoadError(
              'Could not load details for the outstanding invoice.'
            );
            return of(null);
          })
        );
    }
    // If neither route matches, it's an error state
    else {
      this.handleLoadError('Invalid payment route accessed.');
      return; // Stop further execution
    }

    // Common logic after setting up the observable
    this.invoicePreview$.subscribe((preview) => {
      this.isLoadingInvoice = false;
      if (!preview && !this.error) {
        // Handle case where service returns null without error
        this.handleLoadError('Could not load billing details.');
      }
    });
  }

  // Helper to set error and stop loading
  handleLoadError(errorMessage: string): void {
    this.error = errorMessage;
    this.isLoadingInvoice = false;
    this.invoicePreview$ = of(null); // Ensure observable is null on error
  }

  confirmPayment(): void {
    // Use the planId from the loaded invoice data
    this.invoicePreview$.pipe(takeUntil(this.destroy$)).subscribe((invoice) => {
      if (!invoice || this.isProcessingPayment) {
        console.warn(
          'Confirm payment called with no invoice data or already processing.'
        );
        return;
      }

      const planIdToProcess = invoice.planId; // Get planId from the invoice context

      this.isProcessingPayment = true;
      this.error = null;
      console.log(
        `PaymentComponent: Confirming payment for plan ${planIdToProcess}. Is existing: ${this.isPayingExistingInvoice}`
      );

      this.paymentService
        .processPayment(planIdToProcess, this.isPayingExistingInvoice)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: PaymentResult) => {
            this.isProcessingPayment = false;
            if (result.success) {
              console.log('Payment successful:', result.message);
              // this.notificationService.success(result.message);
              this.router.navigate(['/billing']); // Navigate to dashboard on success
            } else {
              console.error('Payment failed:', result.message);
              this.error = result.message;
              // this.notificationService.error(result.message);
            }
          },
          error: (err) => {
            this.isProcessingPayment = false;
            console.error('Error processing payment:', err);
            this.error =
              'An unexpected error occurred during payment. Please try again later.';
            // this.notificationService.error(this.error);
          },
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
