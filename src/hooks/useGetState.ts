export function useGetState<T>(value: T | (() => T)) {
  const [state, _setState] = useState<T>(value)
  const stateRef = useRef<T>(state)

  const getState = useCallback(() => stateRef.current, [])

  const setState = useCallback((value: T) => {
    stateRef.current = value
    _setState(value)
  }, [])

  return [state, setState, getState] as const
}
