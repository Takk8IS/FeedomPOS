import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Product } from '../../shared/types/product'
import { Sale, SaleItem } from '../../shared/types/sale'
import { createSale, generateInvoice } from '../../database/salesService'
import { getProducts, updateProductStock } from '../../database/productService'
import { getSettings } from '../../database/settingsService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { toast } from './ui/toast'
import { printReceipt } from '../../utils/printer'

const SalesSystem: React.FC = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [total, setTotal] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetchProducts()
    fetchSettings()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [cart])

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getProducts()
      setProducts(fetchedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error(t('errors.fetchProducts'))
    }
  }

  const fetchSettings = async () => {
    try {
      const fetchedSettings = await getSettings()
      setSettings(fetchedSettings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error(t('errors.fetchSettings'))
    }
  }

  const calculateTotals = () => {
    const calculatedSubtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity - item.discount,
      0
    )
    const calculatedTax = calculatedSubtotal * (settings?.taxRate / 100 || 0.18)
    setSubtotal(calculatedSubtotal)
    setTax(calculatedTax)
    setTotal(calculatedSubtotal + calculatedTax)
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          discount: 0,
          taxAmount: 0,
        },
      ])
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity > 0) {
      setCart(cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
    } else {
      removeFromCart(productId)
    }
  }

  const completeSale = async () => {
    try {
      const sale: Sale = {
        total,
        subtotal,
        tax,
        paymentMethod,
        items: cart,
        createdAt: new Date(),
      }
      const saleId = await createSale(sale)
      const invoice = await generateInvoice(saleId)
      await printReceipt(invoice)

      // Update product stock
      for (const item of cart) {
        await updateProductStock(item.productId, -item.quantity)
      }

      toast.success(t('sales.saleCompleted'))
      setCart([])
    } catch (error) {
      console.error('Error completing sale:', error)
      toast.error(t('errors.completeSale'))
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-2/3">
        <h2 className="text-2xl font-bold mb-4">{t('sales.products')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">${product.price.toFixed(2)}</p>
              <Button onClick={() => addToCart(product)} className="mt-2 w-full">
                {t('sales.addToCart')}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="md:w-1/3">
        <h2 className="text-2xl font-bold mb-4">{t('sales.cart')}</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">{t('sales.emptyCart')}</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    variant="outline"
                    size="sm"
                  >
                    -
                  </Button>
                  <span className="mx-2">{item.quantity}</span>
                  <Button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    variant="outline"
                    size="sm"
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>{t('sales.subtotal')}:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {t('sales.tax')} ({settings?.taxRate || 18}%):
                </span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t('sales.total')}:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                {t('sales.paymentMethod')}
              </label>
              <Select
                id="paymentMethod"
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value)}
              >
                <Select.Option value="cash">{t('sales.cash')}</Select.Option>
                <Select.Option value="card">{t('sales.card')}</Select.Option>
              </Select>
            </div>
            <Button onClick={completeSale} className="w-full">
              {t('sales.completeSale')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesSystem
