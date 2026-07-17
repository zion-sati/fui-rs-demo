import { defineHostServices, hostService } from '@effindomv2/runtime/managed-harness';

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostServices = defineHostServices({
  appClock: {
    nowUnixSeconds: hostService({
      args: [] as const,
      returns: 'i32',
      implementation(): number {
        return nowUnixSeconds();
      },
    }),
  },
});
