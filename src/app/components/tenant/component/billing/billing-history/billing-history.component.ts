import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { BillingHistoryItem } from '../../../../../core/subscription.model';
import { BillingService } from '../../../../../core/billing.service';
import {
  NgFor,
  NgIf,
  AsyncPipe,
  DatePipe,
  CurrencyPipe,
  LowerCasePipe,
} from '@angular/common';

import { ReplacePipe } from '../../../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-billing-history',
  standalone: true, // Assuming standalone
  imports: [
    NgFor,
    NgIf,
    AsyncPipe,
    DatePipe,
    CurrencyPipe,
    LowerCasePipe,
    ReplacePipe, // Include custom pipe
  ],
  templateUrl: './billing-history.component.html',
  styleUrls: ['./billing-history.component.css'],
})
export class BillingHistoryComponent implements OnInit, OnDestroy {
  billingHistory$: Observable<BillingHistoryItem[]>;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private billingService: BillingService, private router: Router) {
    this.billingHistory$ = of([]); // Initialize
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.billingHistory$ = this.billingService.getBillingHistory().pipe(
      takeUntil(this.destroy$),
      catchError((err) => {
        console.error('Error fetching billing history:', err);
        this.error = 'Could not load billing history. Please try again later.';
        return of([]); // Return empty array on error
      })
    );

    // Stop loading indicator
    this.billingHistory$.subscribe(() => (this.isLoading = false));
  }

  viewInvoiceDetail(invoiceId: string): void {
    if (!invoiceId) return;
    // Navigate to the detail route, passing the invoiceId
    this.router.navigate(['/billing/history', invoiceId]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
