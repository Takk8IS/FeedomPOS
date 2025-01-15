import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from './ui/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Refund } from '../../shared/types/refund';

const { ipcRenderer } = window.require('electron');

const RefundSystem: React.FC = () => {
  const { t } = useTranslation();
  const [saleId, setSaleId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRefund = useCallback(async () => {
    if (!saleId || !amount || !reason) {
      toast.error(t('refunds.invalidRefund'));
      return;
    }

    try {
      setIsLoading(true);
      const refund: Refund = {
        saleId: parseInt(saleId, 10),
        amount: parseFloat(amount),
        reason,
        createdAt: new Date(),
      };

      const result = await ipcRenderer.invoke('create-refund', refund);
      if (result.success) {
        toast.success(t('refunds.created'));
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating refund:', error);
      toast.error(t('errors.createRefund'));
    } finally {
      setIsLoading(false);
    }
  }, [saleId, amount, reason, t]);

  const resetForm = () => {
    setSaleId('');
    setAmount('');
    setReason('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('refunds.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="saleId">{t('refunds.saleId')}</Label>
          <Input
            id="saleId"
            type="number"
            value={saleId}
            onChange={(value) => setSaleId(value)}
            placeholder={t('refunds.saleIdPlaceholder')}
            min="1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t('refunds.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(value) => setAmount(value)}
            placeholder={t('refunds.amountPlaceholder')}
            min="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">{t('refunds.reason')}</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('refunds.reasonPlaceholder')}
            required
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCreateRefund}
          disabled={isLoading || !saleId || !amount || !reason}
          className="w-full"
        >
          {isLoading ? t('common.processing') : t('refunds.create')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RefundSystem;
