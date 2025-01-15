import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { toast } from './ui/toast';
import { Product } from '../../shared/types/product';
import { Order, OrderItem } from '../../shared/types/order';

const { ipcRenderer } = window.require('electron');

const OrderSystem: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
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

  const addOrderItem = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId);
    if (product) {
      setOrderItems((prevItems) => [
        ...prevItems,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          notes: '',
        },
      ]);
    }
  };

  const updateOrderItemQuantity = (index: number, quantity: string) => {
    const parsedQuantity = parseInt(quantity, 10);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
      setOrderItems((prevItems) =>
        prevItems.map((item, i) => (i === index ? { ...item, quantity: parsedQuantity } : item)),
      );
    }
  };

  const updateOrderItemNotes = (index: number, itemNotes: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item, i) => (i === index ? { ...item, notes: itemNotes } : item)),
    );
  };

  const removeOrderItem = (index: number) => {
    setOrderItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    try {
      setIsLoading(true);
      if (!tableNumber || orderItems.length === 0) {
        toast.error(t('orders.invalidOrder'));
        return;
      }

      const order: Order = {
        tableNumber: parseInt(tableNumber, 10),
        items: orderItems,
        status: 'pending',
        notes,
        createdAt: new Date(),
      };

      const result = await ipcRenderer.invoke('create-order', order);
      if (result.success) {
        toast.success(t('orders.created'));
        resetForm();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(t('errors.createOrder'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintOrder = async () => {
    try {
      setIsLoading(true);
      if (!tableNumber || orderItems.length === 0) {
        toast.error(t('orders.invalidOrder'));
        return;
      }

      const result = await ipcRenderer.invoke('print-order', {
        tableNumber: parseInt(tableNumber, 10),
        items: orderItems,
        notes,
      });
      if (result.success) {
        toast.success(t('orders.printed'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error printing order:', error);
      toast.error(t('errors.printOrder'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOrderItems([]);
    setTableNumber('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('orders.title')}</h1>

      <div className="space-y-4">
        <Input
          value={tableNumber}
          onChange={(value) => setTableNumber(value)}
          placeholder={t('orders.tableNumber')}
          type="number"
          min="1"
          required
          aria-label={t('orders.tableNumber')}
        />
        <Select
          onValueChange={addOrderItem}
          placeholder={t('orders.selectProduct')}
          disabled={isLoading || products.length === 0}
        >
          {products.map((product) => (
            <Select.Option key={product.id} value={product.id.toString()}>
              {product.name}
            </Select.Option>
          ))}
        </Select>
        {orderItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="font-medium">{item.name}</span>
            <Input
              type="number"
              value={item.quantity.toString()}
              onChange={(value) => updateOrderItemQuantity(index, value)}
              className="w-20"
              min="1"
              required
              aria-label={t('orders.quantity')}
            />
            <Input
              value={item.notes}
              onChange={(value) => updateOrderItemNotes(index, value)}
              placeholder={t('orders.itemNotes')}
              aria-label={t('orders.itemNotes')}
            />
            <Button
              onClick={() => removeOrderItem(index)}
              variant="destructive"
              aria-label={t('orders.remove')}
            >
              {t('orders.remove')}
            </Button>
          </div>
        ))}
        <Input
          value={notes}
          onChange={(value) => setNotes(value)}
          placeholder={t('orders.notes')}
          aria-label={t('orders.notes')}
        />
        <div className="flex space-x-2">
          <Button onClick={handleCreateOrder} disabled={isLoading || orderItems.length === 0}>
            {t('orders.create')}
          </Button>
          <Button onClick={handlePrintOrder} disabled={isLoading || orderItems.length === 0}>
            {t('orders.print')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSystem;
