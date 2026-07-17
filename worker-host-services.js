// node_modules/@effindomv2/runtime/src/managed-harness/host-services.ts
function hostService(definition) {
  return definition;
}
function defineHostServices(services) {
  return services;
}

// host/worker-host-services.ts
var demoWorkerHostServices = defineHostServices({
  demoWorkerClock: {
    wallClockSinceEpochMs: hostService({
      args: [],
      returns: "f64",
      implementation() {
        return Date.now();
      }
    })
  }
});

// worker-host-services.ts
globalThis.__fuiWorkerHostServicesModule = {
  ...globalThis.__fuiWorkerHostServicesModule ?? {},
  demoWorkerHostServices
};
