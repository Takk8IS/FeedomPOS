import React from 'react'
import { SaleItem } from '../../shared/types/sale'

interface OrderTicketProps {
  items: SaleItem[]
  tableNumber?: number
}

const OrderTicket: React.FC<OrderTicketProps> = ({ items, tableNumber }) => {
  return (
    <div className="order-ticket">
      <h2>Order Ticket</h2>
      {tableNumber && <p>Table: {tableNumber}</p>}
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.quantity}x {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OrderTicket
