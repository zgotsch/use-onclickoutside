import { useEffect } from 'react'
import arePassiveEventsSupported from 'are-passive-events-supported'
import useLatest from 'use-latest'
import isBrowser from './isBrowser.macro'

const MOUSEDOWN = 'mousedown'
const TOUCHSTART = 'touchstart'

type HandledEvents = [typeof MOUSEDOWN, typeof TOUCHSTART]
type HandledEventsType = HandledEvents[number]
type PossibleEvent = {
  [Type in HandledEventsType]: HTMLElementEventMap[Type]
}[HandledEventsType]
type Handler = (event: PossibleEvent) => void

const events: HandledEvents = [MOUSEDOWN, TOUCHSTART]

const getOptions = (event: HandledEventsType) => {
  if (event !== TOUCHSTART) {
    return
  }

  if (arePassiveEventsSupported()) {
    return { passive: true }
  }
}

export default function useOnClickOutside(
  ref:
    | React.RefObject<HTMLElement>
    | ReadonlyArray<React.RefObject<HTMLElement>>,
  handler: Handler | null,
) {
  if (!isBrowser) {
    return
  }

  const handlerRef = useLatest(handler)

  useEffect(() => {
    if (!handler) {
      return
    }

    const listener = (event: PossibleEvent) => {
      let refArray = null
      if (Array.isArray(ref)) {
        refArray = ref
      } else {
        refArray = [ref]
      }

      if (
        !handlerRef.current ||
        refArray
          .filter(r => r.current != null)
          .some(r => r.current.contains(event.target as Node))
      ) {
        return
      }

      handlerRef.current(event)
    }

    events.forEach(event => {
      document.addEventListener(event, listener, getOptions(event))
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(
          event,
          listener,
          getOptions(event) as EventListenerOptions,
        )
      })
    }
  }, [!handler])
}
