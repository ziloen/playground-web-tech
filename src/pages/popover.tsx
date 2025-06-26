import { Popover } from '@base-ui-components/react/popover'

// Popover 组件的使用示例
// 最大宽度为当前视口宽度
// 如果出现超出屏幕边界的情况，应该自动调整位置（仅上下，不能放到左右两侧）
// 窗口可拖动，如果用户进行了拖动，则不再定位到触发元素上

export default function PopoverPage() {
  return (
    <div className="grid h-full overflow-y-auto">
      <div className="flex-center w-full h-[90vh]">
        <Popover.Root>
          <Popover.Trigger>
            <div>123</div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              side="top"
              align="start"
              sticky
              collisionAvoidance={{
                side: 'flip',
                // align: 'shift',
                // align: '',
                // fallbackAxisSide: 'start',
              }}
              trackAnchor={false}
            >
              <Popover.Popup className="bg-[canvas] rounded-lg outline outline-dark-gray-100 px-4 py-2 h-[500px] max-h-[calc(100vh-10px)]">
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
