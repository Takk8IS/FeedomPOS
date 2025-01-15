export type UserRole = 'admin' | 'manager' | 'cashier' | 'accountant';

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserCredentials {
  username: string;
  password: string;
}
