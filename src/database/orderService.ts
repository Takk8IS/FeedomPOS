import knex from './db'
import { Order } from '../shared/types/order'

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<number> {
  const [id] = await knex.transaction(async (trx) => {
    const [orderId] = await trx('orders').insert({
      tableNumber: order.tableNumber,
      status: order.status,
      createdAt: new Date(),
    })

    await trx('order_items').insert(
      order.items.map((item) => ({
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      }))
    )

    return [orderId]
  })

  return id ?? 0
}

export async function getOrderById(id: number): Promise<Order | null> {
  const order = await knex('orders').where('id', id).first()
  if (!order) return null

  const items = await knex('order_items')
    .where('orderId', id)
    .join('products', 'order_items.productId', 'products.id')
    .select('order_items.*', 'products.name')

  return {
    ...order,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
    })),
  }
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<void> {
  await knex('orders').where('id', id).update({ status })
}

export async function deleteOrder(id: number): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('order_items').where('orderId', id).delete()
    await trx('orders').where('id', id).delete()
  })
}

export async function getActiveOrders(): Promise<Order[]> {
  const orders = await knex('orders').whereNot('status', 'completed')
  const orderIds = orders.map((o) => o.id)

  const items = await knex('order_items')
    .whereIn('orderId', orderIds)
    .join('products', 'order_items.productId', 'products.id')
    .select('order_items.*', 'products.name')

  return orders.map((order) => ({
    ...order,
    items: items
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
      })),
  }))
}

export async function printOrderTicket(orderId: number): Promise<void> {
  const order = await getOrderById(orderId)
  if (!order) throw new Error('Order not found')

  // Implement the logic to print the order ticket using the printer utility
  // This is a placeholder and should be replaced with actual printing logic
  console.log('Printing order ticket:', order)
}
