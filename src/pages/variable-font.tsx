import '@fontsource-variable/fira-code'
import '@fontsource-variable/noto-sans-sc'
import { useMotionValue } from 'motion/react'
import { useId } from 'react'

export default function VariableFont() {
  const wght = useMotionValue(400)
  const datalistId = useId()

  return (
    <div>
      <div>
      </div>

      <div className="flex items-center">
        <span>wght:&nbsp;</span>

        <div className="flex flex-col gap-2">
          <input
            type="range"
            list={datalistId}
            defaultValue={400}
            onChange={e => {
              wght.set(+e.target.value)
            }}
            min={100}
            max={900}
            step={1}
          />

          <datalist
            id={datalistId}
            className="flex min-w-0 grow writing-vertical-lr flex-col text-center text-sm justify-between opacity-65 leading-none"
            style={{
              textCombineUpright: 'all',
            }}
          >
            <option value="100" label="100" />
            <option value="200" label="200" />
            <option value="300" label="300" />
            <option value="400" label="400" />
            <option value="500" label="500" />
            <option value="600" label="600" />
            <option value="700" label="700" />
            <option value="800" label="800" />
            <option value="900" label="900" />
          </datalist>
        </div>
      </div>

      <motion.div
        style={{
          fontWeight: wght,
        }}
      >
        <pre className="my-2">
        <code className='font-fira-code'>
          {`const noop = () => {}`}
        </code>
        </pre>

        <div className="font-noto-sans-sc">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.

          但我得向你解释，所有这些谴责快乐和颂扬痛苦的错误观念是如何产生的。为此，我会向你一五一十地说明这一体系，并阐述伟大的真理探索者、人类幸福的杰出建设者的真实教义。没有人因为快乐是快乐而拒绝、厌恶或回避快乐本身，而是因为不知道如何理性地追求快乐的人会遭遇极其痛苦的后果。也没有人因痛苦是痛苦而喜欢或追求或渴望获得痛苦本身，但也偶有辛劳和痛苦能带来极大的快乐的情景。举个微不足道的例子，若不是从中获得好处，我们当中有谁会进行艰苦的体育锻炼？但是，倘若没有恼人的后果，谁有权利指责选择享受快乐的人呢，或者倘若得不到相应快乐，谁能谴责选择避免痛苦的人呢？
        </div>
      </motion.div>
    </div>
  )
}
