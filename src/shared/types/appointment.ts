export interface Appointment {
  id: number
  customerId: number
  serviceId: number
  date: Date
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  createdAt: Date
}
