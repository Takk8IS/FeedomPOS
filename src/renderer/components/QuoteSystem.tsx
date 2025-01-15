import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { toast } from './ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Product } from '../../shared/types/product';
import { Quote, QuoteItem } from '../../shared/types/quote';

const { ipcRenderer } = window.require('electron');

const QuoteSystem: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const result = await ipcRenderer.invoke('get-products');
      if (result.success) {
        setProducts(result.products);
      } else {
        toast.error(t('errors.fetchProducts'));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('errors.fetchProducts'));
    } finally {
      setIsLoading(false);
    }
  };

  const addQuoteItem = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id.toString() === productId);
      if (product) {
        setQuoteItems((prevItems) => [
          ...prevItems,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            discount: 0,
          },
        ]);
      }
    },
    [products],
  );

  const updateQuoteItemQuantity = useCallback((index: number, quantity: string) => {
    const parsedQuantity = parseInt(quantity, 10);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
      setQuoteItems((prevItems) =>
        prevItems.map((item, i) => (i === index ? { ...item, quantity: parsedQuantity } : item)),
      );
    }
  }, []);

  const updateQuoteItemDiscount = useCallback((index: number, discount: string) => {
    const parsedDiscount = parseFloat(discount);
    if (!isNaN(parsedDiscount) && parsedDiscount >= 0 && parsedDiscount <= 100) {
      setQuoteItems((prevItems) =>
        prevItems.map((item, i) => (i === index ? { ...item, discount: parsedDiscount } : item)),
      );
    }
  }, []);

  const removeQuoteItem = useCallback((index: number) => {
    setQuoteItems((prevItems) => prevItems.filter((_, i) => i !== index));
  }, []);

  const calculateTotal = useCallback(() => {
    return quoteItems.reduce((total, item) => {
      return total + item.price * item.quantity * (1 - item.discount / 100);
    }, 0);
  }, [quoteItems]);

  const handleCreateQuote = async () => {
    try {
      setIsLoading(true);
      if (!customerName || quoteItems.length === 0 || !expirationDate) {
        toast.error(t('quotes.invalidQuote'));
        return;
      }

      const quote: Quote = {
        customerName,
        items: quoteItems,
        total: calculateTotal(),
        expirationDate: new Date(expirationDate),
        notes,
        createdAt: new Date(),
      };

      const result = await ipcRenderer.invoke('create-quote', quote);
      if (result.success) {
        toast.success(t('quotes.created'));
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error(t('errors.createQuote'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQuoteItems([]);
    setCustomerName('');
    setExpirationDate('');
    setNotes('');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('quotes.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            value={customerName}
            onChange={(value) => setCustomerName(value)}
            placeholder={t('quotes.customerName')}
            aria-label={t('quotes.customerName')}
          />
          <Input
            type="date"
            value={expirationDate}
            onChange={(value) => setExpirationDate(value)}
            placeholder={t('quotes.expirationDate')}
            aria-label={t('quotes.expirationDate')}
          />
        </div>
        <Select
          onValueChange={addQuoteItem}
          placeholder={t('quotes.selectProduct')}
          disabled={isLoading || products.length === 0}
        >
          {products.map((product) => (
            <Select.Option key={product.id} value={product.id.toString()}>
              {product.name} - ${product.price.toFixed(2)}
            </Select.Option>
          ))}
        </Select>
        {quoteItems.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('quotes.product')}</TableHead>
                <TableHead>{t('quotes.quantity')}</TableHead>
                <TableHead>{t('quotes.price')}</TableHead>
                <TableHead>{t('quotes.discount')}</TableHead>
                <TableHead>{t('quotes.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(value) => updateQuoteItemQuantity(index, value)}
                      className="w-20"
                      min="1"
                      aria-label={t('quotes.quantity')}
                    />
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.discount.toString()}
                      onChange={(value) => updateQuoteItemDiscount(index, value)}
                      className="w-20"
                      min="0"
                      max="100"
                      aria-label={t('quotes.discount')}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => removeQuoteItem(index)}
                      variant="destructive"
                      aria-label={t('quotes.remove')}
                    >
                      {t('quotes.remove')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Input
          value={notes}
          onChange={(value) => setNotes(value)}
          placeholder={t('quotes.notes')}
          aria-label={t('quotes.notes')}
        />
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold">
            {t('quotes.total')}: ${calculateTotal().toFixed(2)}
          </p>
          <Button onClick={handleCreateQuote} disabled={isLoading || quoteItems.length === 0}>
            {t('quotes.create')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteSystem;
