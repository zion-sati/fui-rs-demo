import { defineHostEvents, hostEvent } from '@effindomv2/runtime/managed-harness';

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostEvents = defineHostEvents({
  appClock: {
    tick: hostEvent({
      args: ['i32'] as const,
      subscribe(emit: (value: number) => void) {
        emit(nowUnixSeconds());
        const timer = setInterval(() => {
          emit(nowUnixSeconds());
        }, 1000);
        return () => {
          clearInterval(timer);
        };
      },
    }),
  },
});
