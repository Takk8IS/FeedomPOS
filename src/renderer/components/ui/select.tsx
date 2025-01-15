import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  children,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export const Option: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({
  children,
  ...props
}) => <option {...props}>{children}</option>;

Select.Option = Option;
