import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export type ArchiveSelectOption = {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

type ArchiveSelectProps = {
  value: string
  onChange: (value: string) => void
  options: ArchiveSelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export function ArchiveSelect({
  value,
  onChange,
  options,
  placeholder = 'Todos',
  className,
  'aria-label': ariaLabel,
}: ArchiveSelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const selected = options.find((option) => option.value === value)
  const enabled = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const move = (delta: number) => {
    if (enabled.length === 0) return
    const current = enabled.findIndex(({ index }) => index === active)
    const next = enabled[(current + delta + enabled.length * 2) % enabled.length]
    setActive(next.index)
  }

  const choose = (option: ArchiveSelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('archive-select', className)}>
      <button
        type="button"
        className="archive-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        onClick={() => {
          setOpen((current) => !current)
          setActive(options.findIndex((option) => option.value === value))
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) {
              setOpen(true)
              setActive(options.findIndex((option) => option.value === value))
              return
            }
            move(event.key === 'ArrowDown' ? 1 : -1)
          }
          if (event.key === 'Enter' && open && active >= 0) {
            event.preventDefault()
            choose(options[active])
          }
        }}
      >
        <span className="archive-select-value">
          {selected?.label ?? placeholder}
        </span>
        {selected?.hint ? (
          <span className="archive-select-hint">{selected.hint}</span>
        ) : null}
      </button>
      {open ? (
        <ul id={id} role="listbox" className="archive-select-menu" aria-label={ariaLabel}>
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li key={`${option.value}-${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={cn(
                    'archive-select-option',
                    isSelected && 'is-selected',
                    index === active && 'is-active',
                    option.disabled && 'is-disabled',
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                >
                  <span className="archive-select-option-label">{option.label}</span>
                  {option.hint ? (
                    <span className="archive-select-count">{option.hint}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
