import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Product } from '../../shared/types/product'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsFromXLS,
} from '../../database/productService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from './ui/toast'
import { generateBarcode, printBarcode } from '../../utils/barcodeGenerator'

const InventorySystem: React.FC = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    barcode: '',
    lowStockThreshold: 10,
    category: '',
    taxExempt: false,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getProducts()
      setProducts(fetchedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error(t('errors.fetchProducts'))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewProduct({
      ...newProduct,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduct(newProduct as Product)
      setNewProduct({
        name: '',
        price: 0,
        stock: 0,
        barcode: '',
        lowStockThreshold: 10,
        category: '',
        taxExempt: false,
      })
      fetchProducts()
      toast.success(t('inventory.productCreated'))
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(t('errors.createProduct'))
    }
  }

  const handleUpdateProduct = async (product: Product) => {
    try {
      await updateProduct(product)
      fetchProducts()
      toast.success(t('inventory.productUpdated'))
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(t('errors.updateProduct'))
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId)
      fetchProducts()
      toast.success(t('inventory.productDeleted'))
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error(t('errors.deleteProduct'))
    }
  }

  const handleGenerateBarcode = async (productId: number) => {
    try {
      const barcode = await generateBarcode()
      await handleUpdateProduct({ ...products.find((p) => p.id === productId)!, barcode })
      toast.success(t('inventory.barcodeGenerated'))
    } catch (error) {
      console.error('Error generating barcode:', error)
      toast.error(t('errors.generateBarcode'))
    }
  }

  const handlePrintBarcode = async (productId: number) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (product && product.barcode) {
        await printBarcode(product.barcode)
        toast.success(t('inventory.barcodePrinted'))
      } else {
        toast.error(t('errors.noBarcodeFound'))
      }
    } catch (error) {
      console.error('Error printing barcode:', error)
      toast.error(t('errors.printBarcode'))
    }
  }

  const handleImportProducts = async (file: File) => {
    try {
      await importProductsFromXLS(file)
      fetchProducts()
      toast.success(t('inventory.productsImported'))
    } catch (error) {
      console.error('Error importing products:', error)
      toast.error(t('errors.importProducts'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>

      <form onSubmit={handleCreateProduct} className="space-y-4">
        <Input
          type="text"
          name="name"
          value={newProduct.name}
          onChange={handleInputChange}
          placeholder={t('inventory.productName')}
          required
        />
        <Input
          type="number"
          name="price"
          value={newProduct.price}
          onChange={handleInputChange}
          placeholder={t('inventory.price')}
          required
        />
        <Input
          type="number"
          name="stock"
          value={newProduct.stock}
          onChange={handleInputChange}
          placeholder={t('inventory.stock')}
          required
        />
        <Input
          type="text"
          name="category"
          value={newProduct.category}
          onChange={handleInputChange}
          placeholder={t('inventory.category')}
          required
        />
        <Input
          type="number"
          name="lowStockThreshold"
          value={newProduct.lowStockThreshold}
          onChange={handleInputChange}
          placeholder={t('inventory.lowStockThreshold')}
          required
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            name="taxExempt"
            checked={newProduct.taxExempt}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label htmlFor="taxExempt">{t('inventory.taxExempt')}</label>
        </div>
        <Button type="submit">{t('inventory.addProduct')}</Button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">{t('inventory.name')}</th>
              <th className="px-4 py-2 border-b">{t('inventory.price')}</th>
              <th className="px-4 py-2 border-b">{t('inventory.stock')}</th>
              <th className="px-4 py-2 border-b">{t('inventory.category')}</th>
              <th className="px-4 py-2 border-b">{t('inventory.barcode')}</th>
              <th className="px-4 py-2 border-b">{t('inventory.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2 border-b">{product.name}</td>
                <td className="px-4 py-2 border-b">${product.price.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{product.stock}</td>
                <td className="px-4 py-2 border-b">{product.category}</td>
                <td className="px-4 py-2 border-b">
                  {product.barcode || t('inventory.noBarcode')}
                </td>
                <td className="px-4 py-2 border-b">
                  <Button onClick={() => handleUpdateProduct(product)} className="mr-2">
                    {t('inventory.edit')}
                  </Button>
                  <Button
                    onClick={() => handleDeleteProduct(product.id)}
                    variant="destructive"
                    className="mr-2"
                  >
                    {t('inventory.delete')}
                  </Button>
                  <Button onClick={() => handleGenerateBarcode(product.id)} className="mr-2">
                    {t('inventory.generateBarcode')}
                  </Button>
                  <Button onClick={() => handlePrintBarcode(product.id)}>
                    {t('inventory.printBarcode')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">{t('inventory.importProducts')}</h2>
        <Input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleImportProducts(file)
            }
          }}
        />
      </div>
    </div>
  )
}

export default InventorySystem
