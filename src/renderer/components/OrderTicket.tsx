import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SaleItem } from '../../shared/types/sale';

interface OrderTicketProps {
  items: SaleItem[];
  tableNumber?: number;
  orderNumber: string;
  timestamp: Date;
}

const OrderTicket: React.FC<OrderTicketProps> = ({
  items,
  tableNumber,
  orderNumber,
  timestamp,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="order-ticket w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('orderTicket.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <p>
            <strong>{t('orderTicket.orderNumber')}:</strong> {orderNumber}
          </p>
          {tableNumber && (
            <p>
              <strong>{t('orderTicket.tableNumber')}:</strong> {tableNumber}
            </p>
          )}
          <p>
            <strong>{t('orderTicket.timestamp')}:</strong> {timestamp.toLocaleString()}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('orderTicket.quantity')}</TableHead>
              <TableHead>{t('orderTicket.item')}</TableHead>
              <TableHead>{t('orderTicket.notes')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrderTicket;
