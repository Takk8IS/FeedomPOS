export interface User {
  id: number
  username: string
  password: string
  role: 'admin' | 'manager' | 'cashier' | 'accountant'
  createdAt: Date
  lastLogin?: Date
}
