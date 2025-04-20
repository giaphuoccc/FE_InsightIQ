import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SubscriptionPlan, CurrentSubscription } from './subscription.model';
@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor() {}

  // Mock fetching available plans (Unchanged)
  getAvailablePlans(): Observable<SubscriptionPlan[]> {
    console.log('SubscriptionService: Fetching available plans...');
    const mockPlans: SubscriptionPlan[] = [
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        currency: '$',
        features: [
          '1,000 interactions/mo',
          'Small business scope',
          'Basic support',
        ],
        isRecommended: false,
      },
      {
        id: 'advanced',
        name: 'Advanced',
        price: 99,
        currency: '$',
        features: [
          '5,000 interactions/mo',
          'Medium business scope',
          'Priority support',
          'API Access',
        ],
        isRecommended: true,
      },
      {
        id: 'unlimited',
        name: 'Unlimited',
        price: 499,
        currency: '$',
        features: [
          'Unlimited interactions',
          'Large business scope',
          'Dedicated support',
          'Advanced API Access',
          'Custom integrations',
        ],
        isRecommended: false,
      },
      {
        id: 'payg',
        name: 'Pay-As-You-Go',
        price: 0,
        currency: '$',
        features: ['Flexible usage', 'Pay per interaction'],
        payAsYouGoRate: 0.02,
        payAsYouGoUnit: 'interaction',
        isRecommended: false,
      },
    ];
    return of(mockPlans).pipe(delay(500));
  }

  // Mock fetching the current subscription status
  getCurrentSubscription(): Observable<CurrentSubscription | null> {
    console.log('SubscriptionService: Fetching current subscription...');

    // ** MODIFIED FOR SCENARIO 1 TESTING **
    // Simulate a user needing to pay
    const mockSubscriptionNeedingPayment: CurrentSubscription = {
      planId: 'advanced',
      planName: 'Advanced',
      price: 99,
      currency: '$',
      status: 'Pending Payment', // <-- Status indicating payment needed
      nextBillingDate: '2025-04-15T00:00:00Z', // Due date was in the past or today
      paymentMethod: 'Visa **** 1234',
      billingCycle: 'Monthly',
      interactionLimit: 5000,
    };
    // Simulate no active subscription initially for Scenario 2 testing
    // return of(null).pipe(delay(300));
    // Simulate an active subscription
    // const mockSubscriptionActive: CurrentSubscription = { planId: 'advanced', planName: 'Advanced', price: 99, currency: '$', status: 'Active', nextBillingDate: '2025-05-15T00:00:00Z', paymentMethod: 'Visa **** 1234', billingCycle: 'Monthly', interactionLimit: 5000 };

    // Return the one needing payment for testing Scenario 1
    return of(mockSubscriptionNeedingPayment).pipe(delay(300));
  }

  // In a real app, this would likely call a backend endpoint
  // which might then interact with the PaymentService or directly
  // prepare the ground for payment. For now, it just logs. (Unchanged)
  selectPlanForPurchase(
    planId: string
  ): Observable<{ success: boolean; planId: string }> {
    console.log(`SubscriptionService: Plan selected for purchase - ${planId}`);
    return of({ success: true, planId: planId }).pipe(delay(200));
  }

  // ** NEW HELPER METHOD (Optional but useful) **
  // Checks if the current subscription status requires payment
  needsPayment(status: CurrentSubscription['status']): boolean {
    return status === 'Pending Payment' || status === 'Past Due';
  }
}
