export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  payAsYouGoRate?: number;
  payAsYouGoUnit?: string;
  isRecommended?: boolean;
}

/**
 * Represents the details needed for the payment confirmation screen.
 */
export interface InvoicePreview {
  planId: string;
  planName: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  billingCycle: string;
  invoiceDescription?: string; // e.g., "Invoice for Advanced Plan - May 2025"
}

/**
 * Represents the response after attempting a payment.
 */
export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

/**
 * Represents the currently active subscription (for display).
 */
export interface CurrentSubscription {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  status: 'Active' | 'Pending Payment' | 'Cancelled' | 'Past Due';
  nextBillingDate: string; // ISO date string
  paymentMethod?: string;
  billingCycle: string;
  interactionLimit?: number | string; // Added for UI
}
