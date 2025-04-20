import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SubscriptionPlan } from '../../../../core/subscription.model';
import { SubscriptionService } from '../../../../core/subscription.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
// Optional: Import a notification service (e.g., Toastr)
// import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-change-plan',
  standalone: true, // <--- Make sure it's standalone
  imports: [
    CommonModule,
    NgFor,
    NgIf, // <--- Add NgFor
    // Import other pipes/directives used in the template
  ],
  templateUrl: './change-plan.component.html',
  styleUrls: ['./change-plan.component.css'],
})
export class ChangePlanComponent implements OnInit, OnDestroy {
  availablePlans$: Observable<SubscriptionPlan[]>;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router // private notificationService: NotificationService // Optional
  ) {
    this.availablePlans$ = this.subscriptionService.getAvailablePlans();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.availablePlans$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.isLoading = false),
      error: (err) => {
        console.error('Error fetching plans:', err);
        this.error =
          'Could not load subscription plans. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  selectPlan(planId: string): void {
    if (!planId) {
      console.error('No plan ID provided for selection.');
      // Optionally show user notification
      // this.notificationService.error('Invalid plan selected.');
      return;
    }

    console.log(`Selected plan: ${planId}`);
    this.isLoading = true; // Show loading indicator on button or screen

    // Optional: Call service to acknowledge selection before navigating
    this.subscriptionService
      .selectPlanForPurchase(planId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Navigate to the payment confirmation/checkout component
            // Pass the selected plan ID as a route parameter
            this.router.navigate(['/billing/pay', planId]);
          } else {
            console.error('Failed to initiate plan selection on backend.');
            // this.notificationService.error('Could not initiate subscription. Please try again.');
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error during plan selection initiation:', err);
          // this.notificationService.error('An error occurred. Please try again.');
          this.isLoading = false;
        },
        // No need for complete callback here as isLoading is handled in next/error
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
