import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Toast } from './ui/toast'
import { Appointment } from '../../shared/types/appointment'
import { Customer } from '../../shared/types/customer'

const { ipcRenderer } = window.require('electron')

const AppointmentSystem: React.FC = () => {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const result = await ipcRenderer.invoke('get-customers')
      if (result.success) {
        setCustomers(result.customers)
      } else {
        Toast({ message: t('errors.fetchCustomers'), type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      Toast({ message: t('errors.fetchCustomers'), type: 'error' })
    }
  }

  const handleCreateAppointment = async () => {
    try {
      if (!selectedCustomerId) {
        Toast({ message: t('appointments.selectCustomer'), type: 'error' })
        return
      }

      const appointment: Partial<Appointment> = {
        customerId: selectedCustomerId,
        date: new Date(`${date}T${time}`),
        duration: parseInt(duration),
        status: 'scheduled',
        notes,
        createdAt: new Date(),
      }

      const result = await ipcRenderer.invoke('create-appointment', appointment)
      if (result.success) {
        Toast({ message: t('appointments.created'), type: 'success' })
        // Reset form
        setSelectedCustomerId(null)
        setDate('')
        setTime('')
        setDuration('')
        setNotes('')
      } else {
        Toast({ message: result.message, type: 'error' })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      Toast({ message: t('errors.createAppointment'), type: 'error' })
    }
  }

  const handlePrintAppointment = async () => {
    try {
      if (!selectedCustomerId) {
        Toast({ message: t('appointments.selectCustomer'), type: 'error' })
        return
      }

      const appointment = {
        customerId: selectedCustomerId,
        date: new Date(`${date}T${time}`),
        duration: parseInt(duration),
        notes,
      }

      const result = await ipcRenderer.invoke('print-appointment', appointment)
      if (result.success) {
        Toast({ message: t('appointments.printed'), type: 'success' })
      } else {
        Toast({ message: result.message, type: 'error' })
      }
    } catch (error) {
      console.error('Error printing appointment:', error)
      Toast({ message: t('errors.printAppointment'), type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('appointments.title')}</h1>

      <div className="space-y-4">
        <Select
          value={selectedCustomerId?.toString() || ''}
          onChange={(value: string) => setSelectedCustomerId(parseInt(value))}
        >
          <option value="">{t('appointments.selectCustomer')}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id.toString()}>
              {customer.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          placeholder={t('appointments.date')}
        />
        <Input
          type="time"
          value={time}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
          placeholder={t('appointments.time')}
        />
        <Input
          type="number"
          value={duration}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
          placeholder={t('appointments.duration')}
        />
        <Input
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          placeholder={t('appointments.notes')}
        />
        <Button onClick={handleCreateAppointment}>{t('appointments.create')}</Button>
        <Button onClick={handlePrintAppointment}>{t('appointments.print')}</Button>
      </div>
    </div>
  )
}

export default AppointmentSystem
