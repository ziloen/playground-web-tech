import { Popover } from '@base-ui/react'

// Popover 组件的使用示例
// 最大宽度为当前视口宽度
// 如果出现超出屏幕边界的情况，应该自动调整位置（仅上下，不能放到左右两侧）
// 窗口可拖动，如果用户进行了拖动，则不再定位到触发元素上

export default function PopoverPage() {
  return (
    <div className="grid h-full overflow-y-auto">
      <div className="flex-center h-[90vh] w-full">
        <Popover.Root>
          <Popover.Trigger>
            <div>123</div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              side="top"
              align="start"
              collisionAvoidance={{ fallbackAxisSide: 'none' }}
            >
              <Popover.Popup className="h-[500px] max-h-[calc(var(--available-height)-10px)] rounded-lg bg-[canvas] px-4 py-2 outline outline-dark-gray-100">
                <div className="">popover content</div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className="h-[200vh]"></div>
    </div>
  )
}
