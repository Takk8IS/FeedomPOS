import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../shared/types/product';
import { Sale, SaleItem } from '../../shared/types/sale';
import { Settings } from '../../shared/types/settings';
import { toast } from '../components/ui/toast';
import ProductSearch from '../components/ProductSearch';
import { createSale, generateInvoice } from '../../database/salesService';
import { getProducts, getDiscountForProduct } from '../../database/productService';
import { getSettings } from '../../database/settingsService';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';

const Sales: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('sales.fetchProductsError'));
    }
  }, [t]);

  const fetchSettings = useCallback(async () => {
    try {
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(t('sales.fetchSettingsError'));
    }
  }, [t]);

  useEffect(() => {
    const initializeSales = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchSettings()]);
      setIsLoading(false);
    };
    initializeSales();
  }, [fetchProducts, fetchSettings]);

  useEffect(() => {
    calculateTotals();
  }, [cart, settings]);

  const calculateTotals = useCallback(() => {
    const calculatedSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const calculatedTax = cart.reduce((sum, item) => sum + item.taxAmount, 0);
    setSubtotal(calculatedSubtotal);
    setTax(calculatedTax);
    setTotal(calculatedSubtotal + calculatedTax);
  }, [cart]);

  const calculateItemTotals = useCallback(
    (
      unitPrice: number,
      quantity: number,
      discountAmount: number,
      taxRate: number,
    ): { subtotal: number; taxAmount: number; total: number } => {
      const subtotal = unitPrice * quantity - discountAmount;
      const taxAmount = subtotal * (taxRate / 100);
      return {
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
      };
    },
    [],
  );

  const addToCart = useCallback(
    async (product: Product): Promise<void> => {
      try {
        const taxRate = settings?.taxRate ?? 18;
        const discount = await getDiscountForProduct(product.id);
        const discountAmount = discount ? (product.price * discount.percentage) / 100 : 0;
        const unitPrice = product.price;

        const existingItem = cart.find((item) => item.productId === product.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          const totals = calculateItemTotals(
            unitPrice,
            newQuantity,
            discountAmount * newQuantity,
            taxRate,
          );

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
                : item,
            ),
          );
        } else {
          const totals = calculateItemTotals(unitPrice, 1, discountAmount, taxRate);

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
          };

          setCart([...cart, newItem]);
        }
      } catch (error) {
        console.error('Error adding product to cart:', error);
        toast.error(t('sales.addToCartError'));
      }
    },
    [cart, settings, calculateItemTotals, t],
  );

  const removeFromCart = useCallback(
    (productId: number) => {
      setCart(cart.filter((item) => item.productId !== productId));
    },
    [cart],
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number): void => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      try {
        const taxRate = settings?.taxRate ?? 18;
        setCart(
          cart.map((item) => {
            if (item.productId === productId) {
              const totals = calculateItemTotals(
                item.price,
                quantity,
                (item.discount / item.quantity) * quantity,
                taxRate,
              );
              return {
                ...item,
                quantity,
                ...totals,
                updatedAt: new Date(),
              };
            }
            return item;
          }),
        );
      } catch (error) {
        console.error('Error updating quantity:', error);
        toast.error(t('sales.updateQuantityError'));
      }
    },
    [cart, settings, calculateItemTotals, removeFromCart, t],
  );

  const completeSale = useCallback(async () => {
    try {
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
      console.log('Sale completed with ID:', saleId);
      toast.success(t('sales.saleCompleted'));
      // TODO: Implement invoice printing
      setCart([]);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(t('sales.completeSaleError'));
    }
  }, [total, subtotal, tax, paymentMethod, cart, t]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('sales.title')}</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{t('sales.products')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSearch products={products} onProductSelect={addToCart} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col justify-between">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-muted-foreground">{formatCurrency(product.price)}</p>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button onClick={() => addToCart(product)} className="w-full">
                      {t('sales.addToCart')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-1/3">
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
                      <TableHead>{t('sales.product')}</TableHead>
                      <TableHead>{t('sales.quantity')}</TableHead>
                      <TableHead>{t('sales.price')}</TableHead>
                      <TableHead>{t('sales.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.productId, parseInt(e.target.value))
                              }
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.price)}
                          {item.discount > 0 && (
                            <span className="text-green-600 ml-2">
                              (-{formatCurrency(item.discount)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            {t('sales.remove')}
                          </Button>
                        </TableCell>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
