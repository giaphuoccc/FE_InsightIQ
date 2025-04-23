// src/app/core/models/subscription.model.ts

/**
 * Represents a subscription plan available for selection.
 */
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
  invoiceDescription?: string;
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
  interactionLimit?: number | string;
}

// --- NEW INTERFACES FOR BILLING HISTORY ---

/**
 * Represents a single item in the billing history list.
 */
export interface BillingHistoryItem {
  invoiceId: string; // Unique identifier for the invoice
  invoiceDate: string; // ISO date string
  planName: string;
  totalAmount: number;
  currency: string;
  status: 'Paid' | 'Failed' | 'Pending' | 'Refunded'; // Possible statuses
  // Optional: Add payment method used if available
  paymentMethod?: string;
}

/**
 * Represents the detailed view of a specific past invoice.
 * (Can reuse InvoicePreview or create a more detailed one if needed)
 * For simplicity, we can reuse InvoicePreview and add relevant fields.
 */
export interface BillingHistoryDetail extends InvoicePreview {
  invoiceId: string;
  invoiceDate: string; // ISO date string
  status: BillingHistoryItem['status']; // Status of this specific invoice
  paymentDate?: string; // ISO date string (if paid)
  transactionId?: string; // Transaction ID from payment gateway
  paymentMethodUsed?: string;
  // Add more details if needed, like address, company info etc.
}
