import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'icon';
  children: ReactNode;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button ${variant} ${size === 'icon' ? 'icon-button' : ''} ${className}`}
      {...props}
    />
  );
}
