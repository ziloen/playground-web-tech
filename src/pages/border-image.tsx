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

        <Select.Root defaultValue={'stretch'}>
          <Select.Trigger
            className="min-h-[1lh] min-w-[10ch] rounded-sm border-2 border-solid border-[buttonborder] bg-[field] select-none focus-visible:-outline-offset-1 focus-visible:outline-blue-500 focus-visible:outline-2 focus-visible:outline-blue-400"
            style={{
              borderCollapse: 'separate',
            }}
          >
            <Select.Value placeholder="stretch" />
          </Select.Trigger>

          <Select.Portal>
            <Select.Positioner
              align="start"
              alignOffset={2}
              sideOffset={8}
              className="outline-none"
            >
              <Select.Popup className="max-h-(--available-height) overflow-y-auto bg-[canvas] outline-none">
                {['stretch', 'repeat', 'round', 'space'].map((item) => (
                  <Select.Item
                    className="outline-none cursor-default data-[highlighted]:bg-dark-gray-400"
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
      <Field.Root name="border-image-slice" className="grid grid-cols-subgrid col-span-full">
        <Field.Label>{'border-image-slice'}</Field.Label>
        <Field.Control />
      </Field.Root>

      {/* border image 来源 */}
      <Field.Root name="border-image-source" className="grid grid-cols-subgrid col-span-full">
        <Field.Label>{'border-image-source'}</Field.Label>
        <Field.Control />
      </Field.Root>

      {/* border-image 的显示宽度，最多 4 个值 top | right | bottom | left */}
      <Field.Root name="border-image-width" className="grid grid-cols-subgrid col-span-full">
        <Field.Label>{'border-image-width'}</Field.Label>
        <Field.Control />
      </Field.Root>
    </Form>
  )
}
