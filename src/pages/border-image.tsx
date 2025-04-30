import { Field, Form, Select } from '@base-ui-components/react'

export default function BorderImage() {
  return (
    <div className="size-full">
      <Setting />
    </div>
  )
}

function Setting() {
  return (
    <Form
      className="grid gap-2"
      style={{
        gridTemplateColumns: 'max-content 1fr',
      }}
    >
      {/* border image 向外延申距离 */}
      <Field.Root name="border-image-outset" className="grid grid-cols-subgrid col-span-full">
        <Field.Label>{'border-image-outset'}</Field.Label>
        <Field.Control />
      </Field.Root>

      {/* border image 在上下/左右区域的重复方式 */}
      {/* stretch 不重复图片，拉伸图片 */}
      {/* repeat 重复图片，不拉伸图片，在边缘裁剪 */}
      {/* round 重复图片，但是会拉伸图片，使得图片不会被切割 */}
      {/* space 重复图片，但是会拉伸图片，使得图片不会被切割，且图片之间会有间隔 */}
      <Field.Root name="border-image-repeat" className="grid grid-cols-subgrid col-span-full">
        <Field.Label>{'border-image-repeat'}</Field.Label>

        <Select.Root defaultValue={'stretch'} alignItemToTrigger={false}>
          <Select.Trigger className="min-h-[1lh] px-3 py-2 border min-w-[200px] rounded-md border-solid border-dark-gray-200 bg-dark-gray-800 select-none focus-visible:outline-2 w-fit focus-visible:-outline-offset-1 focus-visible:outline-blue-500 hover:bg-dark-gray-700 shadow-xl">
            <Select.Value placeholder="stretch" />

            <div></div>
          </Select.Trigger>

          <Select.Portal>
            <Select.Positioner
              align="start"
              sideOffset={8}
              className="outline-none"
            >
              <Select.Popup className="max-h-(--available-height) min-w-[200px] overflow-y-auto rounded-md border border-solid border-dark-gray-200 bg-dark-gray-800 outline-none shadow-xl">
                {['stretch', 'repeat', 'round', 'space'].map((item) => (
                  <Select.Item
                    className="cursor-default px-3 py-2 outline-none data-selected:bg-dark-gray-600 data-[highlighted]:bg-dark-gray-400"
                    key={item}
                    value={item}
                  >
                    <Select.ItemText>{item}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </Field.Root>

      {/* 从 border-image-source 中取出长度 */}
      <Field.Root name="border-image-slice" className="col-span-full grid grid-cols-subgrid">
        <Field.Label>{'border-image-slice'}</Field.Label>
        <Field.Control />
      </Field.Root>

      {/* border image 来源 */}
      <Field.Root name="border-image-source" className="col-span-full grid grid-cols-subgrid">
        <Field.Label>{'border-image-source'}</Field.Label>
        <Field.Control />
      </Field.Root>

      {/* border-image 的显示宽度，最多 4 个值 top | right | bottom | left */}
      <Field.Root name="border-image-width" className="col-span-full grid grid-cols-subgrid">
        <Field.Label>{'border-image-width'}</Field.Label>
        <Field.Control />
      </Field.Root>
    </Form>
  )
}
