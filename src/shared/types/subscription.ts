export interface Subscription {
  id: number
  customerId: number
  planType: string
  startDate: Date
  endDate: Date
  status: 'active' | 'cancelled' | 'expired'
}
