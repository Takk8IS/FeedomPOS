import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'
import { Product } from '../../shared/types/product'
import { Order, OrderItem } from '../../shared/types/order'

const { ipcRenderer } = window.require('electron')

const OrderSystem: React.FC = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const result = await ipcRenderer.invoke('get-products')
      if (result.success) {
        setProducts(result.products)
      } else {
        toast.error(t('errors.fetchProducts'))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error(t('errors.fetchProducts'))
    }
  }

  const addOrderItem = (product: Product) => {
    setOrderItems([
      ...orderItems,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        notes: '',
      },
    ])
  }

  const updateOrderItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...orderItems]
    updatedItems[index].quantity = quantity
    setOrderItems(updatedItems)
  }

  const updateOrderItemNotes = (index: number, itemNotes: string) => {
    const updatedItems = [...orderItems]
    updatedItems[index].notes = itemNotes
    setOrderItems(updatedItems)
  }

  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index)
    setOrderItems(updatedItems)
  }

  const handleCreateOrder = async () => {
    try {
      const order: Order = {
        tableNumber: parseInt(tableNumber),
        items: orderItems,
        status: 'pending',
        notes,
        createdAt: new Date(),
      }

      const result = await ipcRenderer.invoke('create-order', order)
      if (result.success) {
        toast.success(t('orders.created'))
        // Reset form
        setOrderItems([])
        setTableNumber('')
        setNotes('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error(t('errors.createOrder'))
    }
  }

  const handlePrintOrder = async () => {
    try {
      const result = await ipcRenderer.invoke('print-order', {
        tableNumber: parseInt(tableNumber),
        items: orderItems,
        notes,
      })
      if (result.success) {
        toast.success(t('orders.printed'))
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error printing order:', error)
      toast.error(t('errors.printOrder'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('orders.title')}</h1>

      <div className="space-y-4">
        <Input
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder={t('orders.tableNumber')}
          type="number"
        />
        <Select
          onValueChange={(value) => addOrderItem(products.find((p) => p.id.toString() === value)!)}
        >
          {products.map((product) => (
            <Select.Option key={product.id} value={product.id.toString()}>
              {product.name}
            </Select.Option>
          ))}
        </Select>
        {orderItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span>{item.name}</span>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => updateOrderItemQuantity(index, parseInt(e.target.value))}
              className="w-20"
            />
            <Input
              value={item.notes}
              onChange={(e) => updateOrderItemNotes(index, e.target.value)}
              placeholder={t('orders.itemNotes')}
            />
            <Button onClick={() => removeOrderItem(index)} variant="destructive">
              {t('orders.remove')}
            </Button>
          </div>
        ))}
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('orders.notes')}
        />
        <Button onClick={handleCreateOrder}>{t('orders.create')}</Button>
        <Button onClick={handlePrintOrder}>{t('orders.print')}</Button>
      </div>
    </div>
  )
}

export default OrderSystem
