export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  customerId: number;
  serviceId: number;
  date: Date;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}
