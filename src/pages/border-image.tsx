import { Field, Form } from '@base-ui-components/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '~/components/Select'

// 参考交互：
// https://developer.mozilla.org/docs/Web/CSS/Guides/Backgrounds_and_borders/Border-image_generator
// https://developer.mozilla.org/docs/Web/CSS/Guides/Backgrounds_and_borders/Border-radius_generator

// TODO: 实现双色/多色 stroke-dasharray
// TODO: 实现斜向 stroke-dasharray，▰▱▰▱ 而不是 ■□■□
// TODO: 同时支持 border-radius

export default function BorderImage() {
  return (
    <div className="size-full">
      <Setting />

      <div
        className="size-40 bg-white/10 resizable rounded-2xl"
        style={{
          borderImageSource:
            `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'6'%20height%3D'6'%20viewBox%3D'0%200%206%206'%3E%3Cdefs%3E%3Cpattern%20id%3D'a'%20width%3D'2'%20height%3D'2'%20patternUnits%3D'userSpaceOnUse'%3E%3Cpath%20fill%3D'%23333'%20d%3D'M0%200h2v2H0z'%2F%3E%3Cpath%20fill%3D'%23ff0'%20d%3D'm0%201%201-1h1L0%202zm1%201%201-1v1z'%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Cpath%20fill%3D'url(%23a)'%20d%3D'M0%200h6v6H0z'%2F%3E%3C%2Fsvg%3E")`,
          borderImageSlice: '2',
          borderImageRepeat: 'round',
          borderImageWidth: '10px',
          borderImageOutset: '0px',
        }}
      >
      </div>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="60"
        viewBox="0 0 6 6"
        id="svg-border-image"
      >
        <defs>
          <pattern
            id="pattern-border-image"
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="2" height="2" fill="#333" />
            <polygon points="0,1 1,0 2,0 2,0 0,2" fill="#ff0" />
            <polygon points="1,2 2,1 2,2" fill="#ff0" />
          </pattern>
        </defs>

        <rect
          x="0"
          y="0"
          width="6"
          height="6"
          fill="url(#pattern-border-image)"
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
