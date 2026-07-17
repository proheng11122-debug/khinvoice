import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconBadgeProps {
  icon: LucideIcon;
  size?: number;
  tint?: 'invoice' | 'danger' | 'success' | 'navy';
  shape?: 'rounded' | 'circle';
  className?: string;
}

const TIN_COLORS = {
  invoice: { bg: '#F4ECF7', color: '#8E44AD' },
  danger: { bg: '#FDEDE9', color: '#E5533D' },
  success: { bg: '#E8F6F0', color: '#1F9D6B' },
  navy: { bg: 'rgba(18, 48, 58, 0.1)', color: '#12303A' },
};

export function IconBadge({
  icon: Icon,
  size = 24,
  tint = 'invoice',
  shape = 'rounded',
  className = '',
}: IconBadgeProps) {
  const colors = TIN_COLORS[tint];

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: size * 1.8,
        height: size * 1.8,
        backgroundColor: colors.bg,
        borderRadius: shape === 'circle' ? '50%' : '25%',
      }}
    >
      <Icon size={size} color={colors.color} strokeWidth={2} />
    </div>
  );
}