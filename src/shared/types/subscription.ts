export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';
export type PlanType = 'basic' | 'premium' | 'enterprise';

export interface Subscription {
  id: number;
  customerId: number;
  planType: PlanType;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt?: Date;
  renewalDate?: Date;
  price: number;
  paymentFrequency: 'monthly' | 'annually';
  autoRenew: boolean;
}
