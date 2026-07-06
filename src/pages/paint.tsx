import { trackPointerMove } from '~/hooks'

export default function PaintPage() {
  return (
    <div className="relative grid size-full grid-cols-[minmax(0,max-content)] grid-rows-[minmax(0,max-content)] place-content-center">
      <img
        src="https://dummyjson.com/image/960x540/333/fff?text=960x540"
        alt="500x500"
        className="col-[1/2] row-[1/2] max-h-full max-w-full"
      />

      <canvas
        className="absolute inset-0 col-[1/2] row-[1/2] size-full bg-green/10"
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
