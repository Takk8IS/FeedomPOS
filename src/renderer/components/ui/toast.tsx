import React from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
}

export const Toast = ({ message, type }: ToastProps) => {
  return <div className={`toast toast-${type}`}>{message}</div>
}

// Add this line to create a toast function
export const toast = {
  success: (message: string) => Toast({ message, type: 'success' }),
  error: (message: string) => Toast({ message, type: 'error' }),
  info: (message: string) => Toast({ message, type: 'info' }),
}
