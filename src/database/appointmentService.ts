import knex from './db';
import { Appointment, AppointmentStatus } from '../shared/types/appointment';

export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt'>,
): Promise<number> {
  const [id] = await knex('appointments').insert({
    ...appointment,
    createdAt: new Date(),
  });
  if (!id) throw new Error('Failed to create appointment');
  return id;
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  const result = await knex('appointments').where('id', id).first();
  return result ? mapAppointment(result) : null;
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  const { id, ...updateData } = appointment;
  await knex('appointments').where('id', id).update(updateData);
}

export async function deleteAppointment(id: number): Promise<void> {
  await knex('appointments').where('id', id).delete();
}

export async function getAppointmentsByCustomer(customerId: number): Promise<Appointment[]> {
  const results = await knex('appointments').where('customerId', customerId);
  return results.map(mapAppointment);
}

export async function getAppointmentsByDate(date: Date): Promise<Appointment[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const results = await knex('appointments').whereBetween('date', [startOfDay, endOfDay]);
  return results.map(mapAppointment);
}

export async function getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
  const now = new Date();
  const results = await knex('appointments')
    .where('date', '>', now)
    .orderBy('date', 'asc')
    .limit(limit);
  return results.map(mapAppointment);
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus,
): Promise<void> {
  await knex('appointments').where('id', id).update({ status });
}

export async function printAppointmentTicket(appointmentId: number): Promise<void> {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  // Implement the logic to print the appointment ticket using the printer utility
  // This is a placeholder and should be replaced with actual printing logic
  console.log('Printing appointment ticket:', appointment);
}

function mapAppointment(result: any): Appointment {
  return {
    id: result.id,
    customerId: result.customerId,
    date: result.date,
    status: result.status as AppointmentStatus,
    notes: result.notes,
    createdAt: result.createdAt,
  };
}
