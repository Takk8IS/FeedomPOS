import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  return <div className={`toast toast-${type}`}>{message}</div>;
};

interface ToastFunction {
  (message: string): JSX.Element;
}

interface ToastInterface {
  success: ToastFunction;
  error: ToastFunction;
  info: ToastFunction;
}

export const toast: ToastInterface = {
  success: (message: string) => <Toast message={message} type="success" />,
  error: (message: string) => <Toast message={message} type="error" />,
  info: (message: string) => <Toast message={message} type="info" />,
};
