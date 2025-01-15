import React from 'react'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

export const Select: React.FC<SelectProps> & {
  Option: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>>
} = ({ value, onChange, children }) => {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="select">
      {children}
    </select>
  )
}

Select.Option = ({ children, ...props }) => <option {...props}>{children}</option>
