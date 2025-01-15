import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'
import { Product } from '../../shared/types/product'
import { Quote, QuoteItem } from '../../shared/types/quote'

const { ipcRenderer } = window.require('electron')

const QuoteSystem: React.FC = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
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

  const addQuoteItem = (product: Product) => {
    setQuoteItems([
      ...quoteItems,
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        discount: 0,
      },
    ])
  }

  const updateQuoteItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...quoteItems]
    updatedItems[index].quantity = quantity
    setQuoteItems(updatedItems)
  }

  const updateQuoteItemDiscount = (index: number, discount: number) => {
    const updatedItems = [...quoteItems]
    updatedItems[index].discount = discount
    setQuoteItems(updatedItems)
  }

  const removeQuoteItem = (index: number) => {
    const updatedItems = quoteItems.filter((_, i) => i !== index)
    setQuoteItems(updatedItems)
  }

  const calculateTotal = () => {
    return quoteItems.reduce((total, item) => {
      return total + item.price * item.quantity * (1 - item.discount / 100)
    }, 0)
  }

  const handleCreateQuote = async () => {
    try {
      const quote: Quote = {
        customerName,
        items: quoteItems,
        total: calculateTotal(),
        expirationDate: new Date(expirationDate),
        notes,
        createdAt: new Date(),
      }

      const result = await ipcRenderer.invoke('create-quote', quote)
      if (result.success) {
        toast.success(t('quotes.created'))
        // Reset form
        setQuoteItems([])
        setCustomerName('')
        setExpirationDate('')
        setNotes('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error(t('errors.createQuote'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('quotes.title')}</h1>

      <div className="space-y-4">
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder={t('quotes.customerName')}
        />
        <Input
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          placeholder={t('quotes.expirationDate')}
        />
        <Select
          onValueChange={(value) => addQuoteItem(products.find((p) => p.id.toString() === value)!)}
        >
          {products.map((product) => (
            <Select.Option key={product.id} value={product.id.toString()}>
              {product.name} - ${product.price.toFixed(2)}
            </Select.Option>
          ))}
        </Select>
        {quoteItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span>{item.name}</span>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => updateQuoteItemQuantity(index, parseInt(e.target.value))}
              className="w-20"
            />
            <Input
              type="number"
              value={item.discount}
              onChange={(e) => updateQuoteItemDiscount(index, parseFloat(e.target.value))}
              className="w-20"
              placeholder={t('quotes.discount')}
            />
            <Button onClick={() => removeQuoteItem(index)} variant="destructive">
              {t('quotes.remove')}
            </Button>
          </div>
        ))}
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('quotes.notes')}
        />
        <p>
          <strong>{t('quotes.total')}:</strong> ${calculateTotal().toFixed(2)}
        </p>
        <Button onClick={handleCreateQuote}>{t('quotes.create')}</Button>
      </div>
    </div>
  )
}

export default QuoteSystem
