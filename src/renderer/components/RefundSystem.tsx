import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'
import { Refund } from '../../shared/types/refund'

const { ipcRenderer } = window.require('electron')

const RefundSystem: React.FC = () => {
  const { t } = useTranslation()
  const [saleId, setSaleId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleCreateRefund = async () => {
    try {
      const refund: Refund = {
        saleId: parseInt(saleId),
        amount: parseFloat(amount),
        reason,
        createdAt: new Date(),
      }

      const result = await ipcRenderer.invoke('create-refund', refund)
      if (result.success) {
        toast.success(t('refunds.created'))
        // Reset form
        setSaleId('')
        setAmount('')
        setReason('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error creating refund:', error)
      toast.error(t('errors.createRefund'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('refunds.title')}</h1>

      <div className="space-y-4">
        <Input
          type="number"
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
          placeholder={t('refunds.saleId')}
        />
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('refunds.amount')}
        />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('refunds.reason')}
        />
        <Button onClick={handleCreateRefund}>{t('refunds.create')}</Button>
      </div>
    </div>
  )
}

export default RefundSystem
