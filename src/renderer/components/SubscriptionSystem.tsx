import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'
import { Subscription } from '../../shared/types/subscription'
import { Customer } from '../../shared/types/customer'

const { ipcRenderer } = window.require('electron')

const SubscriptionSystem: React.FC = () => {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [planType, setPlanType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const result = await ipcRenderer.invoke('get-customers')
      if (result.success) {
        setCustomers(result.customers)
      } else {
        toast.error(t('errors.fetchCustomers'))
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error(t('errors.fetchCustomers'))
    }
  }

  const handleCreateSubscription = async () => {
    try {
      if (!selectedCustomerId) {
        toast.error(t('subscriptions.selectCustomer'))
        return
      }

      const subscription: Subscription = {
        customerId: selectedCustomerId,
        planType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        createdAt: new Date(),
      }

      const result = await ipcRenderer.invoke('create-subscription', subscription)
      if (result.success) {
        toast.success(t('subscriptions.created'))
        // Reset form
        setSelectedCustomerId(null)
        setPlanType('')
        setStartDate('')
        setEndDate('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error(t('errors.createSubscription'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('subscriptions.title')}</h1>

      <div className="space-y-4">
        <Select
          value={selectedCustomerId?.toString() || ''}
          onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
        >
          <Select.Option value="">{t('subscriptions.selectCustomer')}</Select.Option>
          {customers.map((customer) => (
            <Select.Option key={customer.id} value={customer.id.toString()}>
              {customer.name}
            </Select.Option>
          ))}
        </Select>
        <Input
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
          placeholder={t('subscriptions.planType')}
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder={t('subscriptions.startDate')}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder={t('subscriptions.endDate')}
        />
        <Button onClick={handleCreateSubscription}>{t('subscriptions.create')}</Button>
      </div>
    </div>
  )
}

export default SubscriptionSystem
