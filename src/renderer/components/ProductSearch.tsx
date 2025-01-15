import React, { useState } from 'react'
import { Product } from '../../shared/types/product'

interface ProductSearchProps {
  products: Product[]
  onProductSelect: (product: Product) => void
}

const ProductSearch: React.FC<ProductSearchProps> = ({ products, onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value
    setSearchTerm(term)

    if (term.trim() === '') {
      setSearchResults([])
    } else {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) || product.barcode?.includes(term)
      )
      setSearchResults(results)
    }
  }

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Buscar produtos por nome ou código de barras"
        value={searchTerm}
        onChange={handleSearch}
        className="w-full px-3 py-2 border rounded-md"
      />
      {searchResults.length > 0 && (
        <ul className="mt-2 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((product) => (
            <li
              key={product.id}
              onClick={() => {
                onProductSelect(product)
                setSearchTerm('')
                setSearchResults([])
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {product.name} - ${product.price.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ProductSearch
