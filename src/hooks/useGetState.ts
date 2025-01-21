import { useMemoizedFn } from './useMemoizedFn'

export function useGetState<T>(initialState: T | (() => T)) {
  const [state, _setState] = useState<T>(initialState)
  const stateRef = useRef<T>(state)

  const getState = useMemoizedFn(() => stateRef.current)

  const setState = useMemoizedFn((value: T) => {
    stateRef.current = value
    _setState(value)
  })

  return [state, setState, getState] as const
}
