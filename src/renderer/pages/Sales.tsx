import React, { useState, useEffect } from 'react'
import { Product } from '../../shared/types/product'
import { Sale } from '../../shared/types/sale'
import type { Settings } from '../../shared/types/settings'
// import { toast } from '../components/ui/toast'
import ProductSearch from '../components/ProductSearch'
import { createSale, generateInvoice } from '../../database/salesService'
import { getProducts, getDiscountForProduct } from '../../database/productService'
import { getSettings } from '../../database/settingsService'
// import { Button } from '../components/ui/button'
// import { Select } from '../components/ui/select'

interface SaleItem {
  id: number
  productId: number
  name: string
  price: number
  quantity: number
  discount: number
  taxAmount: number
  subtotal: number
  total: number
  tax: number
  createdAt?: Date
  updatedAt?: Date
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [total, setTotal] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [settings, setSettings] = useState<Settings | null>(null)

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
      // toast.error('Failed to fetch products')
    }
  }

  const fetchSettings = async () => {
    try {
      const fetchedSettings = await getSettings()
      setSettings(fetchedSettings as unknown as Settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      // toast.error('Failed to fetch settings')
    }
  }

  const calculateTotals = () => {
    const calculatedSubtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity - item.discount,
      0
    )
    const calculatedTax = calculatedSubtotal * ((settings?.taxRate || 18) / 100)
    setSubtotal(calculatedSubtotal)
    setTax(calculatedTax)
    setTotal(calculatedSubtotal + calculatedTax)
  }

  const calculateItemTotals = (
    unitPrice: number,
    quantity: number,
    discountAmount: number,
    taxRate: number
  ): { subtotal: number; taxAmount: number; total: number } => {
    const subtotal = unitPrice * quantity - discountAmount
    const taxAmount = subtotal * (taxRate / 100)
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    }
  }

  const addToCart = async (product: Product): Promise<void> => {
    try {
      const taxRate = settings?.taxRate ?? 18
      const discount = await getDiscountForProduct(product.id)
      const discountAmount = discount ? (product.price * discount.percentage) / 100 : 0
      const unitPrice = product.price

      const existingItem = cart.find((item) => item.productId === product.id)

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        const totals = calculateItemTotals(
          unitPrice,
          newQuantity,
          discountAmount * newQuantity,
          taxRate
        )

        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  discount: discountAmount * newQuantity,
                  ...totals,
                  updatedAt: new Date(),
                }
              : item
          )
        )
      } else {
        const totals = calculateItemTotals(unitPrice, 1, discountAmount, taxRate)

        const newItem: SaleItem = {
          id: Date.now(),
          productId: product.id,
          name: product.name,
          price: unitPrice,
          quantity: 1,
          discount: discountAmount,
          ...totals,
          tax: totals.taxAmount,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setCart([...cart, newItem])
      }
    } catch (error) {
      console.error('Error adding product to cart:', error)
      // toast.error('Failed to add product to cart')
      throw error
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    try {
      const taxRate = settings?.taxRate ?? 18
      setCart(
        cart.map((item) => {
          if (item.productId === productId) {
            const totals = calculateItemTotals(
              item.price,
              quantity,
              (item.discount / item.quantity) * quantity,
              taxRate
            )
            return {
              ...item,
              quantity,
              ...totals,
              updatedAt: new Date(),
            }
          }
          return item
        })
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      // toast.error('Failed to update quantity')
    }
  }

  const completeSale = async () => {
    try {
      const sale: Sale = {
        total,
        subtotal,
        tax,
        paymentMethod,
        items: cart as any,
        createdAt: new Date(),
      }
      const saleId = await createSale(sale)
      await generateInvoice(saleId)
      console.log('Sale completed with ID:', saleId)
      // toast.success('Sale completed successfully')
      // TODO: Implement invoice printing
      setCart([])
    } catch (error) {
      console.error('Error completing sale:', error)
      // toast.error('Failed to complete sale')
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-2/3">
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        <ProductSearch products={products} onProductSelect={addToCart} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">${product.price.toFixed(2)}</p>
              <button onClick={() => addToCart(product)} className="mt-2 w-full">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="md:w-1/3">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">No items in cart</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">
                    ${item.price.toFixed(2)} x {item.quantity}
                    {item.discount > 0 && (
                      <span className="text-green-600 ml-2">(-${item.discount.toFixed(2)})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="outline"
                  >
                    -
                  </button>
                  <span className="mx-2">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="outline"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({settings?.taxRate || 18}%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
            <button onClick={completeSale} className="w-full">
              Complete Sale
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sales
