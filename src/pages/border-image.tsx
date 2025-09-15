import { Field, Form } from '@base-ui-components/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '~/components/Select'

// 参考交互：https://developer.mozilla.org/docs/Web/CSS/CSS_backgrounds_and_borders/Border-image_generator
// TODO: 实现双色/多色 stroke-dasharray
// TODO: 实现斜向 stroke-dasharray，▰▱▰▱ 而不是 ■□■□
// TODO: 同时支持 border-radius

export default function BorderImage() {
  return (
    <div className="size-full">
      <Setting />

      <svg xmlns="http://www.w3.org/2000/svg" width={100} height={100} viewBox="0 0 100 100">
        <defs>
          <pattern
            id="pattern-border-image"
            width="16"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="10" fill="#333" />
            <rect x="8" width="8" height="10" fill="#ff0" />
          </pattern>
        </defs>

        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="url(#pattern-border-image)"
          strokeWidth="10"
        />
      </svg>
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

        <Select defaultValue="stretch">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {['stretch', 'repeat', 'round', 'space'].map((item) => (
              <SelectItem key={item} value={item}>
                <SelectItemText>{item}</SelectItemText>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
