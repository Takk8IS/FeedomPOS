import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, Option } from './ui/select';
import { toast } from './ui/toast';
import { Appointment } from '../../shared/types/appointment';
import { Customer } from '../../shared/types/customer';

const { ipcRenderer } = window.require('electron');

const AppointmentSystem: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const result = await ipcRenderer.invoke('get-customers');
      if (result.success) {
        setCustomers(result.customers);
      } else {
        toast.error(t('errors.fetchCustomers'));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('errors.fetchCustomers'));
    }
  };

  const handleCreateAppointment = async () => {
    try {
      if (!selectedCustomerId) {
        toast.error(t('appointments.selectCustomer'));
        return;
      }

      const appointment: Partial<Appointment> = {
        customerId: parseInt(selectedCustomerId),
        date: new Date(`${date}T${time}`),
        duration: parseInt(duration),
        status: 'scheduled',
        notes,
        createdAt: new Date(),
      };

      const result = await ipcRenderer.invoke('create-appointment', appointment);
      if (result.success) {
        toast.success(t('appointments.created'));
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(t('errors.createAppointment'));
    }
  };

  const handlePrintAppointment = async () => {
    try {
      if (!selectedCustomerId) {
        toast.error(t('appointments.selectCustomer'));
        return;
      }

      const appointment = {
        customerId: parseInt(selectedCustomerId),
        date: new Date(`${date}T${time}`),
        duration: parseInt(duration),
        notes,
      };

      const result = await ipcRenderer.invoke('print-appointment', appointment);
      if (result.success) {
        toast.success(t('appointments.printed'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error printing appointment:', error);
      toast.error(t('errors.printAppointment'));
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setDate('');
    setTime('');
    setDuration('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('appointments.title')}</h1>

      <div className="space-y-4">
        <Select value={selectedCustomerId} onChange={setSelectedCustomerId}>
          <Option value="">{t('appointments.selectCustomer')}</Option>
          {customers.map((customer) => (
            <Option key={customer.id} value={customer.id.toString()}>
              {customer.name}
            </Option>
          ))}
        </Select>
        <Input type="date" value={date} onChange={setDate} placeholder={t('appointments.date')} />
        <Input type="time" value={time} onChange={setTime} placeholder={t('appointments.time')} />
        <Input
          type="number"
          value={duration}
          onChange={setDuration}
          placeholder={t('appointments.duration')}
        />
        <Input value={notes} onChange={setNotes} placeholder={t('appointments.notes')} />
        <Button onClick={handleCreateAppointment}>{t('appointments.create')}</Button>
        <Button onClick={handlePrintAppointment}>{t('appointments.print')}</Button>
      </div>
    </div>
  );
};

export default AppointmentSystem;
