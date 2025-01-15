import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Product } from '../../shared/types/product';
import debounce from 'lodash/debounce';

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ products, onProductSelect }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        if (term.trim() === '') {
          setSearchResults([]);
        } else {
          const results = products.filter(
            (product) =>
              product.name.toLowerCase().includes(term.toLowerCase()) ||
              product.barcode?.includes(term),
          );
          setSearchResults(results);
        }
      }, 300),
    [products],
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value;
      setSearchTerm(term);
      debouncedSearch(term);
    },
    [debouncedSearch],
  );

  const handleProductSelect = useCallback(
    (product: Product) => {
      onProductSelect(product);
      setSearchTerm('');
      setSearchResults([]);
    },
    [onProductSelect],
  );

  return (
    <div className="space-y-2">
      <Input
        type="text"
        placeholder={t('productSearch.placeholder')}
        value={searchTerm}
        onChange={handleSearch}
        aria-label={t('productSearch.ariaLabel')}
      />
      {searchResults.length > 0 && (
        <ScrollArea className="h-60 border rounded-md">
          <ul className="p-0 m-0">
            {searchResults.map((product) => (
              <li key={product.id} className="list-none">
                <Button
                  variant="ghost"
                  className="w-full text-left px-3 py-2 hover:bg-accent"
                  onClick={() => handleProductSelect(product)}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="ml-2 text-muted-foreground">${product.price.toFixed(2)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

export default ProductSearch;
