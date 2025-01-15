import React from 'react'

interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

export const Input = ({ value, onChange, placeholder, type = 'text' }: InputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input"
    />
  )
}
