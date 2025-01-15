export interface Refund {
id: string;
orderId: string;
orderNumber: string;
amount: number;
reason: string;
items?: Array<{
    itemId: string;
    quantity: number;
    amount: number;
}>;
status: 'pending' | 'completed' | 'cancelled';
refundMethod: 'cash' | 'card' | 'store_credit';
createdAt: Date;
processedAt?: Date;
employeeId: string;
notes?: string;
}

