import { Select as SelectPrimitive } from '@base-ui-components/react'
import { ChevronDownIcon } from '@primer/octicons-react'
import type { ComponentProps } from 'react'
import { cn } from '~/utils'

export function Select<T>({ ...props }: ComponentProps<typeof SelectPrimitive.Root<T>>) {
  return <SelectPrimitive.Root<T> {...props} />
}

export function SelectTrigger(
  { children, className, ...props }: SelectPrimitive.Trigger.Props,
) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'grid min-h-[1lh] w-fit min-w-[200px] grid-flow-col items-center justify-between rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 px-3 py-2 shadow-sm select-none hover:bg-dark-gray-700 outline-none focus-visible:outline-solid outline-2 outline-offset-2 outline-blue-500',
        className,
      )}
      {...props}
    >
      {children}

      <ChevronDownIcon className="opacity-50 in-data-popup-open:rotate-180" size={14} />
    </SelectPrimitive.Trigger>
  )
}

export const SelectValue = SelectPrimitive.Value

export function SelectItem(
  { className, ...props }: SelectPrimitive.Item.Props,
) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'cursor-default px-3 py-2 outline-none data-selected:bg-dark-gray-600 data-[highlighted]:bg-dark-gray-400',
        className,
      )}
      {...props}
    />
  )
}

export function SelectContent(
  { className, children, ...props }:
    & Pick<SelectPrimitive.Popup.Props, 'className' | 'children'>
    & Omit<SelectPrimitive.Positioner.Props, 'className' | 'children'>,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align="start"
        side="bottom"
        sideOffset={8}
        className="outline-none"
        collisionPadding={0}
        alignItemWithTrigger={false}
        {...props}
      >
        <SelectPrimitive.Popup
          className={cn(
            'max-h-(--available-height) min-w-[200px] overflow-y-auto rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 shadow-lg outline-none data-starting-style:opacity-0 transition-[scale,opacity] data-starting-style:scale-90 data-ending-style:opacity-0 data-ending-style:scale-90 origin-(--transform-origin)',
            className,
          )}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export const SelectItemText = SelectPrimitive.ItemText
