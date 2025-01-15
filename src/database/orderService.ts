import knex from './db';
import { Order, OrderItem } from '../shared/types/order';

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<number> {
  const [id] = await knex.transaction(async (trx) => {
    const [orderId] = await trx('orders').insert({
      tableNumber: order.tableNumber,
      status: order.status,
      createdAt: new Date(),
    });

    await trx('orderItems').insert(
      order.items.map((item) => ({
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      })),
    );

    return [orderId];
  });

  return id ?? 0;
}

export async function getOrderById(id: number): Promise<Order | null> {
  const order = await knex('orders').where('id', id).first();
  if (!order) return null;

  const items = await knex('orderItems')
    .where('orderId', id)
    .join('products', 'orderItems.productId', 'products.id')
    .select('orderItems.*', 'products.name');

  return {
    ...mapOrder(order),
    items: items.map(mapOrderItem),
  };
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<void> {
  await knex('orders').where('id', id).update({ status });
}

export async function deleteOrder(id: number): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('orderItems').where('orderId', id).delete();
    await trx('orders').where('id', id).delete();
  });
}

export async function getActiveOrders(): Promise<Order[]> {
  const orders = await knex('orders').whereNot('status', 'completed');
  const orderIds = orders.map((o) => o.id);

  const items = await knex('orderItems')
    .whereIn('orderId', orderIds)
    .join('products', 'orderItems.productId', 'products.id')
    .select('orderItems.*', 'products.name');

  return orders.map((order) => ({
    ...mapOrder(order),
    items: items.filter((item) => item.orderId === order.id).map(mapOrderItem),
  }));
}

export async function printOrderTicket(orderId: number): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  // Implement the logic to print the order ticket using the printer utility
  // This is a placeholder and should be replaced with actual printing logic
  console.log('Printing order ticket:', order);
}

function mapOrder(result: any): Omit<Order, 'items'> {
  return {
    id: result.id,
    tableNumber: result.tableNumber,
    status: result.status,
    createdAt: result.createdAt,
  };
}

function mapOrderItem(result: any): OrderItem {
  return {
    productId: result.productId,
    name: result.name,
    quantity: result.quantity,
    notes: result.notes,
  };
}
