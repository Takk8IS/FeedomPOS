import knex from './db';
import { User } from '../shared/types/user';
import bcrypt from 'bcrypt';

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<number> {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const [id] = await knex('users').insert({
    ...user,
    password: hashedPassword,
    createdAt: new Date(),
  });
  if (!id) {
    throw new Error('Failed to create user');
  }
  return id;
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await knex('users').where('id', id).first();
  return result ? mapUser(result) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await knex('users').where('username', username).first();
  return result ? mapUser(result) : null;
}

export async function updateUser(user: User): Promise<void> {
  const { id, ...updateData } = user;
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  await knex('users').where('id', id).update(updateData);
}

export async function deleteUser(id: number): Promise<void> {
  await knex('users').where('id', id).delete();
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return user;
}

export async function updateLastLogin(userId: number): Promise<void> {
  await knex('users').where('id', userId).update({ lastLogin: new Date() });
}

function mapUser(result: any): User {
  return {
    id: result.id,
    username: result.username,
    password: result.password,
    role: result.role,
    lastLogin: result.lastLogin ? new Date(result.lastLogin) : null,
    createdAt: new Date(result.createdAt),
  };
}
