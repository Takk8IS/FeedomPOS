import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { toast } from './ui/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Subscription } from '../../shared/types/subscription';
import { Customer } from '../../shared/types/customer';

const { ipcRenderer } = window.require('electron');

const SubscriptionSystem: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [planType, setPlanType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await ipcRenderer.invoke('get-customers');
      if (result.success) {
        setCustomers(result.customers);
      } else {
        toast.error(t('errors.fetchCustomers'));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('errors.fetchCustomers'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleCreateSubscription = useCallback(async () => {
    if (!selectedCustomerId || !planType || !startDate || !endDate) {
      toast.error(t('subscriptions.fillAllFields'));
      return;
    }

    try {
      setIsLoading(true);
      const subscription: Subscription = {
        customerId: parseInt(selectedCustomerId, 10),
        planType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        createdAt: new Date(),
      };

      const result = await ipcRenderer.invoke('create-subscription', subscription);
      if (result.success) {
        toast.success(t('subscriptions.created'));
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(t('errors.createSubscription'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomerId, planType, startDate, endDate, t]);

  const resetForm = useCallback(() => {
    setSelectedCustomerId('');
    setPlanType('');
    setStartDate('');
    setEndDate('');
  }, []);

  const isFormValid = useMemo(() => {
    return selectedCustomerId && planType && startDate && endDate;
  }, [selectedCustomerId, planType, startDate, endDate]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('subscriptions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer">{t('subscriptions.customer')}</Label>
          <Select
            id="customer"
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
            disabled={isLoading}
          >
            <Select.Option value="">{t('subscriptions.selectCustomer')}</Select.Option>
            {customers.map((customer) => (
              <Select.Option key={customer.id} value={customer.id.toString()}>
                {customer.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="planType">{t('subscriptions.planType')}</Label>
          <Input
            id="planType"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            placeholder={t('subscriptions.planTypePlaceholder')}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('subscriptions.startDate')}</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('subscriptions.endDate')}</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCreateSubscription}
          disabled={isLoading || !isFormValid}
          className="w-full"
        >
          {isLoading ? t('common.processing') : t('subscriptions.create')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionSystem;
