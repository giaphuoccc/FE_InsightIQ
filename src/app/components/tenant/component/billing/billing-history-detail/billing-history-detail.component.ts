import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Import RouterLink
import { Observable, Subject, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { BillingHistoryDetail } from '../../../../../core/subscription.model';
import { BillingService } from '../../../../../core/billing.service';
import {
  NgIf,
  AsyncPipe,
  DatePipe,
  CurrencyPipe,
  LowerCasePipe,
} from '@angular/common';
import { ReplacePipe } from '../../../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-billing-history-detail',
  standalone: true, // Assuming standalone
  imports: [
    NgIf,
    AsyncPipe,
    DatePipe,
    CurrencyPipe,
    LowerCasePipe,
    ReplacePipe,
    RouterLink, // Include RouterLink for back button
  ],
  templateUrl: './billing-history-detail.component.html',
  styleUrls: ['./billing-history-detail.component.css'],
})
export class BillingHistoryDetailComponent implements OnInit, OnDestroy {
  invoiceDetail$: Observable<BillingHistoryDetail | null>;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute, // Inject ActivatedRoute to get route params
    private billingService: BillingService
  ) {
    this.invoiceDetail$ = of(null); // Initialize
  }

  ngOnInit(): void {
    this.isLoading = true;
    // Use ActivatedRoute to get the 'invoiceId' parameter from the URL
    this.invoiceDetail$ = this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap((params) => {
        const invoiceId = params.get('invoiceId'); // Get ID from route
        if (!invoiceId) {
          this.error = 'Invoice ID not found in route.';
          console.error(
            'BillingHistoryDetailComponent: No invoiceId found in route parameters.'
          );
          return of(null);
        }
        console.log(
          `BillingHistoryDetailComponent: Fetching details for invoice ${invoiceId}`
        );
        // Call the service method with the retrieved ID
        return this.billingService.getInvoiceDetail(invoiceId).pipe(
          catchError((err) => {
            console.error('Error fetching invoice detail:', err);
            this.error = 'Could not load invoice details.';
            return of(null); // Return null on error
          })
        );
      })
    );

    // Stop loading indicator
    this.invoiceDetail$.subscribe((detail) => {
      this.isLoading = false;
      if (!detail && !this.error) {
        // Handle case where invoice is not found by service
        this.error = 'Invoice details not found.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
