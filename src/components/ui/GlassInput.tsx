import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type GlassInputProps = InputHTMLAttributes<HTMLInputElement>

export function GlassInput({ className, ...props }: GlassInputProps) {
  return <input className={cn('glass-input', className)} {...props} />
}
