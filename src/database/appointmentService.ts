import knex from './db'
import { Appointment } from '../shared/types/appointment'

export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt'>
): Promise<number> {
  const result = await knex('appointments').insert({
    ...appointment,
    created_at: new Date(),
  })
  const id = result[0]
  if (!id) throw new Error('Failed to create appointment')
  return id
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  return knex('appointments').where('id', id).first()
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  const { id, ...updateData } = appointment
  await knex('appointments').where('id', id).update(updateData)
}

export async function deleteAppointment(id: number): Promise<void> {
  await knex('appointments').where('id', id).delete()
}

export async function getAppointmentsByCustomer(customerId: number): Promise<Appointment[]> {
  return knex('appointments').where('customer_id', customerId)
}

export async function getAppointmentsByDate(date: Date): Promise<Appointment[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return knex('appointments').whereBetween('date', [startOfDay, endOfDay])
}

export async function getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
  const now = new Date()
  return knex('appointments').where('date', '>', now).orderBy('date', 'asc').limit(limit)
}

export async function updateAppointmentStatus(
  id: number,
  status: Appointment['status']
): Promise<void> {
  await knex('appointments').where('id', id).update({ status })
}

export async function printAppointmentTicket(appointmentId: number): Promise<void> {
  const appointment = await getAppointmentById(appointmentId)
  if (!appointment) throw new Error('Appointment not found')

  // Implement the logic to print the appointment ticket using the printer utility
  // This is a placeholder and should be replaced with actual printing logic
  console.log('Printing appointment ticket:', appointment)
}
