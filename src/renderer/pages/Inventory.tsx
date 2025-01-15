import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../shared/types/product';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../database/productService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from '../components/ui/toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';

const Inventory: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    barcode: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('inventory.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (name: string, value: string | number) => {
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(newProduct as Product);
      setNewProduct({ name: '', price: 0, stock: 0, barcode: '' });
      fetchProducts();
      toast.success(t('inventory.productCreated'));
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(t('inventory.createError'));
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      await updateProduct(product);
      fetchProducts();
      setEditingProduct(null);
      setIsDialogOpen(false);
      toast.success(t('inventory.productUpdated'));
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(t('inventory.updateError'));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm(t('inventory.confirmDelete'))) {
      try {
        await deleteProduct(productId);
        fetchProducts();
        toast.success(t('inventory.productDeleted'));
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error(t('inventory.deleteError'));
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.addProduct')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventory.productName')}</Label>
              <Input
                id="name"
                name="name"
                value={newProduct.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('inventory.productNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{t('inventory.price')}</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={newProduct.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                placeholder={t('inventory.pricePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">{t('inventory.stock')}</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={newProduct.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                placeholder={t('inventory.stockPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">{t('inventory.barcode')}</Label>
              <Input
                id="barcode"
                name="barcode"
                value={newProduct.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder={t('inventory.barcodePlaceholder')}
              />
            </div>
            <Button type="submit">{t('inventory.addProduct')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.productList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inventory.name')}</TableHead>
                  <TableHead>{t('inventory.price')}</TableHead>
                  <TableHead>{t('inventory.stock')}</TableHead>
                  <TableHead>{t('inventory.barcode')}</TableHead>
                  <TableHead>{t('inventory.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.barcode || t('inventory.notAvailable')}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => openEditDialog(product)}
                        className="mr-2"
                        variant="secondary"
                      >
                        {t('inventory.edit')}
                      </Button>
                      <Button onClick={() => handleDeleteProduct(product.id)} variant="destructive">
                        {t('inventory.delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inventory.editProduct')}</DialogTitle>
            <DialogDescription>{t('inventory.editProductDescription')}</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct(editingProduct);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('inventory.productName')}</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">{t('inventory.price')}</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock">{t('inventory.stock')}</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-barcode">{t('inventory.barcode')}</Label>
                <Input
                  id="edit-barcode"
                  value={editingProduct.barcode}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, barcode: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit">{t('inventory.saveChanges')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
