import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { CurrentSubscription } from '../../../../../core/subscription.model';
import { SubscriptionService } from '../../../../../core/subscription.service';
import { ReplacePipe } from '../../../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-current-subscription',
  templateUrl: './current-subscription.component.html',
  styleUrls: ['./current-subscription.component.css'],
  // Assuming standalone for consistency with previous examples
  standalone: true,
  imports: [CommonModule, ReplacePipe], // Import necessary common modules/pipes
})
export class CurrentSubscriptionComponent implements OnInit, OnDestroy {
  currentSubscription$: Observable<CurrentSubscription | null>;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router
  ) {
    this.currentSubscription$ = of(null); // Initialize
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.currentSubscription$ = this.subscriptionService
      .getCurrentSubscription()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Error fetching current subscription:', err);
          this.error = 'Could not load subscription details.';
          return of(null); // Return null on error
        })
      );

    // Stop loading indicator
    this.currentSubscription$.subscribe(() => (this.isLoading = false));
  }

  // Helper method to check if payment is needed based on status
  needsPayment(subscription: CurrentSubscription | null): boolean {
    return (
      !!subscription &&
      this.subscriptionService.needsPayment(subscription.status)
    );
  }

  // Navigate to the dedicated route for paying the outstanding invoice
  payOutstandingInvoice(): void {
    console.log('Navigating to pay outstanding invoice...');
    // Navigate to the new route specifically for paying the current invoice
    this.router.navigate(['/billing/pay-invoice']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
