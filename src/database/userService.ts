import knex from './db'
import { User } from '../shared/types/user'
import bcrypt from 'bcrypt'

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<number> {
  const hashedPassword = await bcrypt.hash(user.password, 10)
  const result = await knex('users').insert({
    ...user,
    password: hashedPassword,
    created_at: new Date(),
  })
  if (!result[0]) {
    throw new Error('Failed to create user')
  }
  return result[0]
}

export async function getUserById(id: number): Promise<User | null> {
  return knex('users').where('id', id).first()
}

export async function getUserByUsername(username: string): Promise<User | null> {
  return knex('users').where('username', username).first()
}

export async function updateUser(user: User): Promise<void> {
  const { id, ...updateData } = user
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10)
  }
  await knex('users').where('id', id).update(updateData)
}

export async function deleteUser(id: number): Promise<void> {
  await knex('users').where('id', id).delete()
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username)
  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null

  return user
}

export async function updateLastLogin(userId: number): Promise<void> {
  await knex('users').where('id', userId).update({ last_login: new Date() })
}
