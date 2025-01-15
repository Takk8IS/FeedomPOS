import React, { useState, useEffect } from 'react'
import { Product } from '../../shared/types/product'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../database/productService'

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    barcode: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const fetchedProducts = await getProducts()
    setProducts(fetchedProducts)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewProduct({ ...newProduct, [name]: value })
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProduct(newProduct as Product)
    setNewProduct({ name: '', price: 0, stock: 0, barcode: '' })
    fetchProducts()
  }

  const handleUpdateProduct = async (product: Product) => {
    await updateProduct(product)
    fetchProducts()
  }

  const handleDeleteProduct = async (productId: number) => {
    await deleteProduct(productId)
    fetchProducts()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      <form onSubmit={handleCreateProduct} className="space-y-4">
        <input
          type="text"
          name="name"
          value={newProduct.name}
          onChange={handleInputChange}
          placeholder="Product Name"
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        <input
          type="number"
          name="price"
          value={newProduct.price}
          onChange={handleInputChange}
          placeholder="Price"
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        <input
          type="number"
          name="stock"
          value={newProduct.stock}
          onChange={handleInputChange}
          placeholder="Stock"
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        <input
          type="text"
          name="barcode"
          value={newProduct.barcode}
          onChange={handleInputChange}
          placeholder="Barcode (optional)"
          className="w-full px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-200"
        >
          Add Product
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Price</th>
              <th className="px-4 py-2 border-b">Stock</th>
              <th className="px-4 py-2 border-b">Barcode</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2 border-b">{product.name}</td>
                <td className="px-4 py-2 border-b">${product.price.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{product.stock}</td>
                <td className="px-4 py-2 border-b">{product.barcode || 'N/A'}</td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleUpdateProduct(product)}
                    className="mr-2 bg-secondary text-white py-1 px-2 rounded hover:bg-secondary-dark transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="bg-danger text-white py-1 px-2 rounded hover:bg-danger-dark transition duration-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Inventory
