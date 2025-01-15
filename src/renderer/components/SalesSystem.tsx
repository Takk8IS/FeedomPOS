import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../shared/types/product';
import { Sale, SaleItem } from '../../shared/types/sale';
import { createSale, generateInvoice } from '../../database/salesService';
import { getProducts, updateProductStock } from '../../database/productService';
import { getSettings } from '../../database/settingsService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { toast } from './ui/toast';
import { printReceipt } from '../../utils/printer';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

interface Settings {
  taxRate: number;
  currency: string;
}

const SalesSystem: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [cart, settings]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('errors.fetchProducts'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(t('errors.fetchSettings'));
    }
  };

  const calculateTotals = useCallback(() => {
    const calculatedSubtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity - item.discount,
      0,
    );
    const calculatedTax = calculatedSubtotal * ((settings?.taxRate || 18) / 100);
    setSubtotal(calculatedSubtotal);
    setTax(calculatedTax);
    setTotal(calculatedSubtotal + calculatedTax);
  }, [cart, settings]);

  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            discount: 0,
            taxAmount: 0,
          },
        ];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity > 0) {
        setCart((prevCart) =>
          prevCart.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        );
      } else {
        removeFromCart(productId);
      }
    },
    [removeFromCart],
  );

  const completeSale = async () => {
    try {
      setIsLoading(true);
      const sale: Sale = {
        total,
        subtotal,
        tax,
        paymentMethod,
        items: cart,
        createdAt: new Date(),
      };
      const saleId = await createSale(sale);
      const invoice = await generateInvoice(saleId);
      await printReceipt(invoice);

      // Update product stock
      for (const item of cart) {
        await updateProductStock(item.productId, -item.quantity);
      }

      toast.success(t('sales.saleCompleted'));
      setCart([]);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(t('errors.completeSale'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings?.currency || 'en-US', {
      style: 'currency',
      currency: settings?.currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-2/3">
        <CardHeader>
          <CardTitle>{t('sales.products')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col justify-between">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground">{formatCurrency(product.price)}</p>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button
                      onClick={() => addToCart(product)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      {t('sales.addToCart')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card className="lg:w-1/3">
        <CardHeader>
          <CardTitle>{t('sales.cart')}</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-muted-foreground">{t('sales.emptyCart')}</p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('sales.item')}</TableHead>
                    <TableHead>{t('sales.quantity')}</TableHead>
                    <TableHead>{t('sales.price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                          >
                            -
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t('sales.subtotal')}:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {t('sales.tax')} ({settings?.taxRate || 18}%):
                  </span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{t('sales.total')}:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="paymentMethod" className="block text-sm font-medium">
                  {t('sales.paymentMethod')}
                </label>
                <Select
                  id="paymentMethod"
                  value={paymentMethod}
                  onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}
                  disabled={isLoading}
                >
                  <Select.Option value="cash">{t('sales.cash')}</Select.Option>
                  <Select.Option value="card">{t('sales.card')}</Select.Option>
                </Select>
              </div>
              <Button
                onClick={completeSale}
                className="w-full"
                disabled={isLoading || cart.length === 0}
              >
                {isLoading ? t('common.processing') : t('sales.completeSale')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesSystem;
