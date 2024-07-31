import { Form, Input, Select } from 'antd'

export default function BorderImage() {
  return (
    <div className="size-full">
      <Setting />
    </div>
  )
}

function Setting() {
  return (
    <Form>
      {/* border image 向外延申距离 */}
      <Form.Item name="border-image-outset" label="border-image-outset">
        <Input />
      </Form.Item>

      {/* border image 在上下/左右区域的重复方式 */}
      {/* stretch 不重复图片，拉伸图片 */}
      {/* repeat 重复图片，不拉伸图片，在边缘裁剪 */}
      {/* round 重复图片，但是会拉伸图片，使得图片不会被切割 */}
      {/* space 重复图片，但是会拉伸图片，使得图片不会被切割，且图片之间会有间隔 */}
      <Form.Item name="border-image-repeat" label="border-image-repeat">
        <Select>
          <Select.Option value="stretch">stretch</Select.Option>
          <Select.Option value="repeat">repeat</Select.Option>
          <Select.Option value="round">round</Select.Option>
          <Select.Option value="space">space</Select.Option>
        </Select>

        <Select>
          <Select.Option value="stretch">stretch</Select.Option>
          <Select.Option value="repeat">repeat</Select.Option>
          <Select.Option value="round">round</Select.Option>
          <Select.Option value="space">space</Select.Option>
        </Select>
      </Form.Item>

      {/* 从 border-image-source 中取出长度 */}
      <Form.Item name="border-image-slice" label="border-image-slice">
        <Input />
      </Form.Item>

      {/* border image 来源 */}
      <Form.Item name="border-image-source" label="border-image-source">
        <Input />
      </Form.Item>

      {/* border-image 的显示宽度，最多 4 个值 top | right | bottom | left */}
      <Form.Item name="border-image-width" label="border-image-width">
        <Input />
      </Form.Item>
    </Form>
  )
}
