import type { RefCallback } from 'react'
import { trackPointerMove, useMemoizedFn } from '~/hooks'

export default function PaintPage() {
  return (
    <div className="relative grid size-full place-content-center">
      <img
        src="https://dummyjson.com/image/960x540/333/fff?text=960x540"
        alt="960x540"
        className="max-h-full max-w-full area-[1/1/2/2]"
      />

      <canvas
        className="absolute inset-0 size-full bg-linear-to-r from-green/10 to-red/10 area-[1/1/2/2]"
        onPointerDown={(e) => {
          trackPointerMove(e, {
            captureOn: 'pointerdown',
            onMove(e, position) {},
            onEnd(e, position) {},
          })
        }}
      />
    </div>
  )
}
