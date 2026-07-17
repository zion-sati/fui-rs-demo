(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/@effindomv2/runtime/src/managed-harness/host-services.ts
  function assertIdentifier(value, context) {
    if (!IDENTIFIER_RE.test(value)) {
      throw new Error(`${context} "${value}" must be a valid identifier.`);
    }
  }
  function capitalize(value) {
    return value.length === 0 ? value : `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
  }
  function buildImportName(serviceName, methodName) {
    return `${serviceName}${capitalize(methodName)}`;
  }
  function validateServiceType(type, context) {
    if (type === "string" || type === "bool" || type === "i32" || type === "u32" || type === "i64" || type === "u64" || type === "f64" || type === "bytes" || type === "i32_array" || type === "u32_array" || type === "i64_array" || type === "u64_array" || type === "f64_array" || type === "void") {
      return;
    }
    throw new Error(`${context} uses unsupported host-service type "${type}".`);
  }
  function listHostServiceMethods(services) {
    if (services === void 0) {
      return [];
    }
    const methods = [];
    const seenImports = /* @__PURE__ */ new Set();
    for (const [serviceName, serviceMethods] of Object.entries(services)) {
      assertIdentifier(serviceName, "Host service");
      for (const [methodName, definition] of Object.entries(serviceMethods)) {
        assertIdentifier(methodName, `Host service ${serviceName} method`);
        const importName = definition.importName ?? buildImportName(serviceName, methodName);
        assertIdentifier(importName, `Host service ${serviceName}.${methodName} import`);
        if (seenImports.has(importName)) {
          throw new Error(`Duplicate host-service import name "${importName}".`);
        }
        seenImports.add(importName);
        const args = [...definition.args];
        args.forEach((type, index) => {
          validateServiceType(type, `Host service ${serviceName}.${methodName} arg ${String(index)}`);
        });
        validateServiceType(definition.returns, `Host service ${serviceName}.${methodName} return`);
        methods.push({
          serviceName,
          methodName,
          importName,
          args,
          returns: definition.returns,
          implementation: definition.implementation
        });
      }
    }
    methods.sort((left, right) => left.importName.localeCompare(right.importName));
    return methods;
  }
  function getHostServiceImportNames(services) {
    return new Set(listHostServiceMethods(services).map((method) => method.importName));
  }
  function expectNumber(value, context) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(`${context} must be a number.`);
    }
    return value;
  }
  function expectBoolean(value, context) {
    if (typeof value !== "boolean") {
      throw new Error(`${context} must be a boolean.`);
    }
    return value;
  }
  function expectString(value, context) {
    if (typeof value !== "string") {
      throw new Error(`${context} must be a string.`);
    }
    return value;
  }
  function expectBytes(value, context) {
    if (!(value instanceof Uint8Array)) {
      throw new Error(`${context} must be a Uint8Array.`);
    }
    return value;
  }
  function expectInt32Array(value, context) {
    if (!(value instanceof Int32Array)) {
      throw new Error(`${context} must be an Int32Array.`);
    }
    return value;
  }
  function expectFloat64Array(value, context) {
    if (!(value instanceof Float64Array)) {
      throw new Error(`${context} must be a Float64Array.`);
    }
    return value;
  }
  function expectBigInt64Array(value, context) {
    if (!(value instanceof BigInt64Array)) {
      throw new Error(`${context} must be a BigInt64Array.`);
    }
    return value;
  }
  function expectBigUint64Array(value, context) {
    if (!(value instanceof BigUint64Array)) {
      throw new Error(`${context} must be a BigUint64Array.`);
    }
    return value;
  }
  function expectUint32Array(value, context) {
    if (!(value instanceof Uint32Array)) {
      throw new Error(`${context} must be a Uint32Array.`);
    }
    return value;
  }
  function expectI32(value, context) {
    const numberValue = expectNumber(value, context);
    if (!Number.isInteger(numberValue) || numberValue < -2147483648 || numberValue > 2147483647) {
      throw new Error(`${context} must be a signed 32-bit integer.`);
    }
    return numberValue;
  }
  function expectU32(value, context) {
    const numberValue = expectNumber(value, context);
    if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 4294967295) {
      throw new Error(`${context} must be an unsigned 32-bit integer.`);
    }
    return numberValue;
  }
  function expectI64(value, context) {
    if (typeof value !== "bigint") {
      throw new Error(`${context} must be a bigint.`);
    }
    if (value < -9223372036854775808n || value > 9223372036854775807n) {
      throw new Error(`${context} must be a signed 64-bit integer.`);
    }
    return value;
  }
  function expectU64(value, context) {
    if (typeof value !== "bigint") {
      throw new Error(`${context} must be a bigint.`);
    }
    if (value < 0n || value > 18446744073709551615n) {
      throw new Error(`${context} must be an unsigned 64-bit integer.`);
    }
    return value;
  }
  function expectLength(value, context) {
    const length = expectNumber(value, context);
    if (!Number.isInteger(length) || length < 0) {
      throw new Error(`${context} must be a non-negative integer.`);
    }
    return length;
  }
  function bytesToI32Array(bytes, context) {
    if ((bytes.byteLength & 3) !== 0) {
      throw new Error(`${context} payload length must be divisible by 4.`);
    }
    const values = new Int32Array(bytes.byteLength >>> 2);
    new Uint8Array(values.buffer).set(bytes);
    return values;
  }
  function bytesToU32Array(bytes, context) {
    if ((bytes.byteLength & 3) !== 0) {
      throw new Error(`${context} payload length must be divisible by 4.`);
    }
    const values = new Uint32Array(bytes.byteLength >>> 2);
    new Uint8Array(values.buffer).set(bytes);
    return values;
  }
  function bytesToF64Array(bytes, context) {
    if ((bytes.byteLength & 7) !== 0) {
      throw new Error(`${context} payload length must be divisible by 8.`);
    }
    const values = new Float64Array(bytes.byteLength >>> 3);
    new Uint8Array(values.buffer).set(bytes);
    return values;
  }
  function bytesToI64Array(bytes, context) {
    if ((bytes.byteLength & 7) !== 0) {
      throw new Error(`${context} payload length must be divisible by 8.`);
    }
    const values = new BigInt64Array(bytes.byteLength >>> 3);
    new Uint8Array(values.buffer).set(bytes);
    return values;
  }
  function bytesToU64Array(bytes, context) {
    if ((bytes.byteLength & 7) !== 0) {
      throw new Error(`${context} payload length must be divisible by 8.`);
    }
    const values = new BigUint64Array(bytes.byteLength >>> 3);
    new Uint8Array(values.buffer).set(bytes);
    return values;
  }
  function typedArrayBytes(value) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  function consumedRawArgCount(method) {
    let count = 0;
    method.args.forEach((type) => {
      count += type === "string" || type === "bytes" || type === "i32_array" || type === "u32_array" || type === "i64_array" || type === "u64_array" || type === "f64_array" ? 2 : 1;
    });
    return count;
  }
  function decodeHostServiceArgs(method, rawArgs, io) {
    const decodedArgs = [];
    let index = 0;
    method.args.forEach((type, argIndex) => {
      const context = `Host service ${method.serviceName}.${method.methodName} arg ${String(argIndex)}`;
      if (type === "string") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectNumber(rawArgs[index + 1], `${context} len`);
        decodedArgs.push(len <= 0 ? "" : io.readString(ptr, len));
        index += 2;
        return;
      }
      if (type === "bytes") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        decodedArgs.push(len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len));
        index += 2;
        return;
      }
      if (type === "i32_array") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        const payload = len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len << 2);
        decodedArgs.push(bytesToI32Array(payload, context));
        index += 2;
        return;
      }
      if (type === "u32_array") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        const payload = len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len << 2);
        decodedArgs.push(bytesToU32Array(payload, context));
        index += 2;
        return;
      }
      if (type === "f64_array") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        const payload = len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len << 3);
        decodedArgs.push(bytesToF64Array(payload, context));
        index += 2;
        return;
      }
      if (type === "i64_array") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        const payload = len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len << 3);
        decodedArgs.push(bytesToI64Array(payload, context));
        index += 2;
        return;
      }
      if (type === "u64_array") {
        const ptr = expectNumber(rawArgs[index], `${context} ptr`);
        const len = expectLength(rawArgs[index + 1], `${context} len`);
        const payload = len <= 0 ? new Uint8Array(0) : io.readBytes(ptr, len << 3);
        decodedArgs.push(bytesToU64Array(payload, context));
        index += 2;
        return;
      }
      const rawValue = rawArgs[index];
      if (type === "bool") {
        decodedArgs.push(expectNumber(rawValue, context) !== 0);
      } else if (type === "i32") {
        decodedArgs.push(expectI32(rawValue, context));
      } else if (type === "u32") {
        decodedArgs.push(expectU32(rawValue, context));
      } else if (type === "i64") {
        decodedArgs.push(expectI64(rawValue, context));
      } else if (type === "u64") {
        decodedArgs.push(expectU64(rawValue, context));
      } else if (type === "f64") {
        decodedArgs.push(expectNumber(rawValue, context));
      } else {
        throw new Error(`${context} uses unsupported type ${type}.`);
      }
      index += 1;
    });
    return decodedArgs;
  }
  function createHostServiceImportModule(services, io) {
    const module = {};
    for (const method of listHostServiceMethods(services)) {
      module[method.importName] = (...rawArgs) => {
        const decodedArgs = decodeHostServiceArgs(method, rawArgs, io);
        const result = method.implementation(...decodedArgs);
        const resultContext = `Host service ${method.serviceName}.${method.methodName} result`;
        if (method.returns === "void") {
          return void 0;
        }
        if (method.returns === "string") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeString(ptr, capacity, expectString(result, resultContext), resultContext);
        }
        if (method.returns === "bytes") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, expectBytes(result, resultContext), resultContext);
        }
        if (method.returns === "i32_array") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, typedArrayBytes(expectInt32Array(result, resultContext)), resultContext);
        }
        if (method.returns === "u32_array") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, typedArrayBytes(expectUint32Array(result, resultContext)), resultContext);
        }
        if (method.returns === "f64_array") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, typedArrayBytes(expectFloat64Array(result, resultContext)), resultContext);
        }
        if (method.returns === "i64_array") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, typedArrayBytes(expectBigInt64Array(result, resultContext)), resultContext);
        }
        if (method.returns === "u64_array") {
          const outputIndex = consumedRawArgCount(method);
          const ptr = expectNumber(rawArgs[outputIndex], `${resultContext} ptr`);
          const capacity = expectNumber(rawArgs[outputIndex + 1], `${resultContext} capacity`);
          return io.writeBytes(ptr, capacity, typedArrayBytes(expectBigUint64Array(result, resultContext)), resultContext);
        }
        if (method.returns === "bool") {
          return expectBoolean(result, resultContext) ? 1 : 0;
        }
        if (method.returns === "i32") {
          return expectI32(result, resultContext);
        }
        if (method.returns === "u32") {
          return expectU32(result, resultContext);
        }
        if (method.returns === "i64") {
          return expectI64(result, resultContext);
        }
        if (method.returns === "u64") {
          return expectU64(result, resultContext);
        }
        return expectNumber(result, resultContext);
      };
    }
    return module;
  }
  var IDENTIFIER_RE;
  var init_host_services = __esm({
    "node_modules/@effindomv2/runtime/src/managed-harness/host-services.ts"() {
      IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
    }
  });

  // node_modules/@effindomv2/runtime/src/managed-harness/worker-bootstrap.ts
  var require_worker_bootstrap = __commonJS({
    "node_modules/@effindomv2/runtime/src/managed-harness/worker-bootstrap.ts"() {
      init_host_services();
      var workerScope = globalThis;
      var decoder = new TextDecoder();
      var encoder = new TextEncoder();
      var activeWorkerId = null;
      var activeCancellationRequested = false;
      var pendingCancellationRequested = false;
      var activeFile = null;
      var allowedWorkerHostImports = /* @__PURE__ */ new Set([
        "fui_fetch_start",
        "fui_fetch_cancel",
        "fui_file_read_chunk",
        "fui_file_worker_write_chunk",
        "fui_worker_report_progress",
        "fui_worker_complete_string",
        "fui_worker_fail",
        "fui_worker_is_cancelled",
        "fui_worker_request_yield",
        "fui_worker_request_yield_delay"
      ]);
      function describeError(error) {
        return error instanceof Error ? error.message : String(error);
      }
      function loadWorkerHostServices(config) {
        if (config === void 0) {
          return void 0;
        }
        workerScope.importScripts(config.scriptUrl);
        const bundle = workerScope.__fuiWorkerHostServicesModule;
        if (bundle === void 0) {
          throw new Error(`Worker host-services bundle ${config.scriptUrl} did not initialize __fuiWorkerHostServicesModule.`);
        }
        const exported = bundle[config.exportName];
        if (typeof exported !== "object" || exported === null) {
          throw new Error(`Worker host-services bundle ${config.scriptUrl} does not export "${config.exportName}".`);
        }
        return exported;
      }
      function validateWorkerImports(module2, hostServices) {
        const allowedHostServiceImports = getHostServiceImportNames(hostServices);
        const imports = WebAssembly.Module.imports(module2);
        for (const imported of imports) {
          if (imported.kind !== "function") {
            throw new Error(`Worker import ${imported.module}.${imported.name} is not allowed.`);
          }
          if (imported.module === "env" && imported.name === "abort") {
            continue;
          }
          if (imported.module === "fui_worker_host" && allowedWorkerHostImports.has(imported.name)) {
            continue;
          }
          if (imported.module === "fui_fetch_host" && allowedWorkerHostImports.has(imported.name)) {
            continue;
          }
          if (imported.module === "fui_host_service" && allowedHostServiceImports.has(imported.name)) {
            continue;
          }
          throw new Error(`Worker import ${imported.module}.${imported.name} is not allowed.`);
        }
      }
      function readUtf8(memory, ptr, len) {
        if (memory === null || len <= 0) {
          return "";
        }
        return decoder.decode(new Uint8Array(memory.buffer, ptr, len));
      }
      function writeUtf8(memory, ptr, capacity, text, context) {
        if (memory === null) {
          throw new Error(`${context} requires worker memory.`);
        }
        if (capacity <= 0) {
          if (text.length === 0) {
            return 0;
          }
          throw new Error(`${context} cannot write into a zero-length worker host-service buffer.`);
        }
        const encoded = encoder.encode(text);
        if (encoded.length > capacity) {
          throw new Error(`${context} exceeds the worker host-service result buffer.`);
        }
        if (encoded.length > 0) {
          new Uint8Array(memory.buffer, ptr, encoded.length).set(encoded);
        }
        return encoded.length;
      }
      function readBytes(memory, ptr, len) {
        if (memory === null || len <= 0) {
          return new Uint8Array(0);
        }
        const bytes = new Uint8Array(len);
        bytes.set(new Uint8Array(memory.buffer, ptr, len));
        return bytes;
      }
      function writeBytes(memory, ptr, capacity, bytes, context) {
        if (memory === null) {
          throw new Error(`${context} requires worker memory.`);
        }
        if (capacity < 0) {
          throw new Error(`${context} has invalid worker host-service buffer capacity.`);
        }
        if (bytes.length > capacity) {
          throw new Error(`${context} exceeds the worker host-service result buffer.`);
        }
        if (bytes.length > 0) {
          new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
        }
        return bytes.length;
      }
      function encodeTextPartsPayload(values) {
        const encodedValues = values.map((value) => encoder.encode(value));
        let totalBytes = 4;
        for (const encoded of encodedValues) {
          totalBytes += 4 + encoded.length;
        }
        const bytes = new Uint8Array(totalBytes);
        const dataView = new DataView(bytes.buffer);
        let byteOffset = 0;
        dataView.setUint32(byteOffset, values.length >>> 0, true);
        byteOffset += 4;
        for (const encoded of encodedValues) {
          dataView.setUint32(byteOffset, encoded.length >>> 0, true);
          byteOffset += 4;
          if (encoded.length > 0) {
            bytes.set(encoded, byteOffset);
            byteOffset += encoded.length;
          }
        }
        return bytes;
      }
      async function startWorker(message) {
        let memory = null;
        let terminalSent = false;
        let yieldRequested = false;
        let requestedYieldDelayMs = 0;
        let resumeScheduled = false;
        let callbackBufferPtr = 0;
        let callbackBufferSize = 0;
        let wasmExports = null;
        const activeFetchRequests = /* @__PURE__ */ new Map();
        const inputBytes = new TextEncoder().encode(message.input);
        const hostServices = loadWorkerHostServices(message.workerHostServices);
        let entry = null;
        let entryStarted = false;
        activeWorkerId = message.workerId;
        activeCancellationRequested = pendingCancellationRequested;
        pendingCancellationRequested = false;
        function readCancelFlag() {
          return activeWorkerId === message.workerId && activeCancellationRequested;
        }
        function cancelAllFetchRequests() {
          for (const controller of activeFetchRequests.values()) {
            controller.abort();
          }
          activeFetchRequests.clear();
        }
        function writeCallbackBytes(bytes, context) {
          if (callbackBufferSize <= 0) {
            throw new Error(`${context} requires the worker callback buffer.`);
          }
          if (bytes.length > callbackBufferSize) {
            throw new Error(`${context} exceeds the worker callback buffer.`);
          }
          if (memory === null) {
            throw new Error(`${context} requires worker memory.`);
          }
          if (bytes.length > 0) {
            new Uint8Array(memory.buffer, callbackBufferPtr, bytes.length).set(bytes);
          }
          return {
            ptr: bytes.length > 0 ? callbackBufferPtr : 0,
            len: bytes.length
          };
        }
        function emitFetchComplete(requestId, ok, status, statusText, url, exports2) {
          const callback = exports2.__fui_on_fetch_complete;
          if (typeof callback !== "function") {
            throw new Error("Worker module is missing __fui_on_fetch_complete.");
          }
          const payload = writeCallbackBytes(encodeTextPartsPayload([statusText, url]), "Worker fetch completion payload");
          callback(
            requestId,
            ok,
            status,
            payload.ptr,
            payload.len
          );
        }
        function emitFetchError(requestId, message2, exports2) {
          const callback = exports2.__fui_on_fetch_error;
          if (typeof callback !== "function") {
            throw new Error("Worker module is missing __fui_on_fetch_error.");
          }
          const payload = writeCallbackBytes(encoder.encode(message2), "Worker fetch failure payload");
          callback(
            requestId,
            payload.ptr,
            payload.len
          );
        }
        function scheduleResume() {
          if (resumeScheduled || terminalSent || entry === null) {
            return;
          }
          resumeScheduled = true;
          const delayMs = requestedYieldDelayMs > 0 ? requestedYieldDelayMs : 0;
          requestedYieldDelayMs = 0;
          setTimeout(() => {
            resumeScheduled = false;
            if (terminalSent || entry === null) {
              return;
            }
            runEntry();
          }, delayMs);
        }
        function hasTerminalSent() {
          return terminalSent;
        }
        function hasYieldRequested() {
          return yieldRequested;
        }
        function failWorker(error) {
          if (terminalSent) {
            return;
          }
          terminalSent = true;
          cancelAllFetchRequests();
          activeWorkerId = null;
          activeCancellationRequested = false;
          workerScope.postMessage({
            type: "error",
            workerId: message.workerId,
            text: describeError(error)
          });
        }
        function runEntry() {
          if (entry === null || hasTerminalSent()) {
            return;
          }
          try {
            yieldRequested = false;
            if (!entryStarted) {
              entryStarted = true;
              if (inputBytes.length > callbackBufferSize) {
                throw new Error("Worker input exceeds the worker callback buffer.");
              }
              if (inputBytes.length > 0) {
                if (memory === null) {
                  throw new Error("Worker input requires worker memory.");
                }
                new Uint8Array(memory.buffer, callbackBufferPtr, inputBytes.length).set(inputBytes);
              }
              entry(
                inputBytes.length > 0 ? callbackBufferPtr : 0,
                inputBytes.length
              );
            } else {
              entry(0, 0);
            }
          } catch (error) {
            failWorker(error);
            return;
          }
          if (hasTerminalSent()) {
            return;
          }
          if (hasYieldRequested()) {
            scheduleResume();
            return;
          }
          failWorker("Worker exited without calling Worker.complete(...), Worker.fail(...), or Worker.yield(...).");
        }
        try {
          const response = await fetch(message.wasmUrl, {
            cache: "no-store",
            credentials: "same-origin"
          });
          if (!response.ok) {
            throw new Error(`Failed to load worker wasm from ${message.wasmUrl}.`);
          }
          const bytes = await response.arrayBuffer();
          const module2 = await WebAssembly.compile(bytes);
          validateWorkerImports(module2, hostServices);
          const instance = await WebAssembly.instantiate(module2, {
            env: {
              abort(_message, _fileName, line, column) {
                throw new Error(`Worker aborted at ${String(line ?? 0)}:${String(column ?? 0)}.`);
              }
            },
            fui_host_service: createHostServiceImportModule(hostServices, {
              readString: (ptr, len) => readUtf8(memory, ptr, len),
              writeString: (ptr, capacity, text, context) => writeUtf8(memory, ptr, capacity, text, context),
              readBytes: (ptr, len) => readBytes(memory, ptr, len),
              writeBytes: (ptr, capacity, bytes2, context) => writeBytes(memory, ptr, capacity, bytes2, context)
            }),
            fui_worker_host: {
              fui_worker_report_progress(ptr, len) {
                if (terminalSent) {
                  return;
                }
                workerScope.postMessage({
                  type: "progress",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_complete_string(ptr, len) {
                if (terminalSent) {
                  return;
                }
                terminalSent = true;
                cancelAllFetchRequests();
                activeWorkerId = null;
                activeCancellationRequested = false;
                workerScope.postMessage({
                  type: "complete",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_fail(ptr, len) {
                if (terminalSent) {
                  return;
                }
                terminalSent = true;
                cancelAllFetchRequests();
                activeWorkerId = null;
                activeCancellationRequested = false;
                workerScope.postMessage({
                  type: "error",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_is_cancelled() {
                return readCancelFlag() ? 1 : 0;
              },
              fui_worker_request_yield() {
                yieldRequested = true;
                requestedYieldDelayMs = 0;
              },
              fui_worker_request_yield_delay(delayMs) {
                yieldRequested = true;
                requestedYieldDelayMs = Number.isFinite(delayMs) && delayMs > 0 ? Math.floor(delayMs) : 0;
              },
              fui_file_read_chunk(offsetLow, offsetHigh, length) {
                if (activeFile === null) {
                  return 0;
                }
                const offset = Number(BigInt(offsetLow >>> 0) | BigInt(offsetHigh >>> 0) << 32n);
                const safeLength = Math.max(0, length | 0);
                if (offset >= activeFile.size || safeLength <= 0) {
                  return 0;
                }
                const blob = activeFile.slice(offset, Math.min(offset + safeLength, activeFile.size));
                const reader = new FileReaderSync();
                const buffer = reader.readAsArrayBuffer(blob);
                const bytes2 = new Uint8Array(buffer);
                const written = bytes2.length;
                if (written <= 0) {
                  return 0;
                }
                if (memory === null || callbackBufferSize <= 0) {
                  return 0;
                }
                if (written > callbackBufferSize) {
                  throw new Error("File chunk exceeds the worker callback buffer.");
                }
                new Uint8Array(memory.buffer, callbackBufferPtr, written).set(bytes2);
                return written;
              },
              fui_file_worker_write_chunk(ptr, len) {
                if (memory === null || len <= 0) {
                  return;
                }
                const bytes2 = new Uint8Array(len);
                bytes2.set(new Uint8Array(memory.buffer, ptr, len));
                const buffer = bytes2.buffer.slice(0, bytes2.byteLength);
                workerScope.postMessage({
                  type: "file-process-chunk",
                  workerId: message.workerId,
                  bytes: buffer
                }, [buffer]);
              }
            },
            fui_fetch_host: {
              fui_fetch_start(requestId, methodPtr, methodLen, urlPtr, urlLen, headersPtr, headersLen, bodyPtr, bodyLen) {
                const controller = new AbortController();
                const method = readUtf8(memory, methodPtr, methodLen);
                const url = readUtf8(memory, urlPtr, urlLen);
                const headerBytes = memory === null || headersLen <= 0 ? new Uint8Array(0) : new Uint8Array(memory.buffer.slice(headersPtr, headersPtr + headersLen));
                if (headerBytes.byteLength < 4 && headersLen > 0) {
                  throw new Error("Worker fetch header payload was truncated.");
                }
                const headers = new Headers();
                if (headerBytes.byteLength >= 4) {
                  const dataView = new DataView(headerBytes.buffer, headerBytes.byteOffset, headerBytes.byteLength);
                  let byteOffset = 0;
                  const count = dataView.getUint32(byteOffset, true);
                  byteOffset += 4;
                  const values = [];
                  for (let index = 0; index < count; index += 1) {
                    if (byteOffset + 4 > headerBytes.byteLength) {
                      throw new Error("Worker fetch header length was truncated.");
                    }
                    const partLen = dataView.getUint32(byteOffset, true);
                    byteOffset += 4;
                    if (byteOffset + partLen > headerBytes.byteLength) {
                      throw new Error("Worker fetch header value was truncated.");
                    }
                    values.push(partLen > 0 ? decoder.decode(headerBytes.subarray(byteOffset, byteOffset + partLen)) : "");
                    byteOffset += partLen;
                  }
                  if ((values.length & 1) != 0) {
                    throw new Error("Worker fetch headers were malformed.");
                  }
                  for (let index = 0; index < values.length; index += 2) {
                    headers.append(values[index] ?? "", values[index + 1] ?? "");
                  }
                }
                const body = memory === null || bodyLen <= 0 ? null : memory.buffer.slice(bodyPtr, bodyPtr + bodyLen);
                activeFetchRequests.set(requestId, controller);
                const init = {
                  method,
                  headers,
                  signal: controller.signal
                };
                if (body !== null) {
                  init.body = body;
                }
                void fetch(url, init).then((response2) => {
                  const active = activeFetchRequests.get(requestId);
                  if (active === void 0 || active !== controller || terminalSent) {
                    return;
                  }
                  activeFetchRequests.delete(requestId);
                  if (wasmExports === null) {
                    throw new Error("Worker fetch completed before wasm exports were ready.");
                  }
                  emitFetchComplete(requestId, response2.ok, response2.status, response2.statusText, response2.url, wasmExports);
                }).catch((error) => {
                  const active = activeFetchRequests.get(requestId);
                  if (active === void 0 || active !== controller) {
                    return;
                  }
                  activeFetchRequests.delete(requestId);
                  if (controller.signal.aborted || terminalSent) {
                    return;
                  }
                  if (wasmExports === null) {
                    throw new Error("Worker fetch failed before wasm exports were ready.");
                  }
                  emitFetchError(requestId, describeError(error), wasmExports);
                });
              },
              fui_fetch_cancel(requestId) {
                const controller = activeFetchRequests.get(requestId);
                if (controller === void 0) {
                  return;
                }
                activeFetchRequests.delete(requestId);
                controller.abort();
              }
            }
          });
          const exports2 = instance.exports;
          wasmExports = exports2;
          if (!(exports2.memory instanceof WebAssembly.Memory)) {
            throw new Error("Worker module did not export memory.");
          }
          memory = exports2.memory;
          if (typeof exports2.__fui_worker_text_buffer !== "function" || typeof exports2.__fui_worker_text_buffer_size !== "function") {
            throw new Error("Worker module did not export the fetch callback buffer.");
          }
          callbackBufferPtr = exports2.__fui_worker_text_buffer();
          callbackBufferSize = exports2.__fui_worker_text_buffer_size();
          const exportedEntry = exports2[message.entryName];
          if (typeof exportedEntry !== "function") {
            throw new Error(`Worker export "${message.entryName}" is missing.`);
          }
          entry = exportedEntry;
          runEntry();
        } catch (error) {
          cancelAllFetchRequests();
          activeWorkerId = null;
          activeCancellationRequested = false;
          workerScope.postMessage({
            type: "error",
            workerId: message.workerId,
            text: describeError(error)
          });
        }
      }
      async function startFileProcessWorker(message) {
        let memory = null;
        let terminalSent = false;
        let callbackBufferPtr = 0;
        let callbackBufferSize = 0;
        let wasmExports = null;
        const activeFetchRequests = /* @__PURE__ */ new Map();
        let entry = null;
        activeWorkerId = message.workerId;
        activeCancellationRequested = pendingCancellationRequested;
        activeFile = message.file;
        pendingCancellationRequested = false;
        function readCancelFlag() {
          return activeWorkerId === message.workerId && activeCancellationRequested;
        }
        function cancelAllFetchRequests() {
          for (const controller of activeFetchRequests.values()) {
            controller.abort();
          }
          activeFetchRequests.clear();
        }
        function writeCallbackBytes(bytes, context) {
          if (callbackBufferSize <= 0) {
            throw new Error(`${context} requires the worker callback buffer.`);
          }
          if (bytes.length > callbackBufferSize) {
            throw new Error(`${context} exceeds the worker callback buffer.`);
          }
          if (memory === null) {
            throw new Error(`${context} requires worker memory.`);
          }
          if (bytes.length > 0) {
            new Uint8Array(memory.buffer, callbackBufferPtr, bytes.length).set(bytes);
          }
          return {
            ptr: bytes.length > 0 ? callbackBufferPtr : 0,
            len: bytes.length
          };
        }
        function emitFetchComplete(requestId, ok, status, statusText, url, exports2) {
          const callback = exports2.__fui_on_fetch_complete;
          if (typeof callback !== "function") {
            throw new Error("Worker module is missing __fui_on_fetch_complete.");
          }
          const payload = writeCallbackBytes(encodeTextPartsPayload([statusText, url]), "Worker fetch completion payload");
          callback(
            requestId,
            ok,
            status,
            payload.ptr,
            payload.len
          );
        }
        function emitFetchError(requestId, message2, exports2) {
          const callback = exports2.__fui_on_fetch_error;
          if (typeof callback !== "function") {
            throw new Error("Worker module is missing __fui_on_fetch_error.");
          }
          const payload = writeCallbackBytes(encoder.encode(message2), "Worker fetch failure payload");
          callback(
            requestId,
            payload.ptr,
            payload.len
          );
        }
        function runEntry() {
          if (entry === null || wasmExports === null) {
            return;
          }
          try {
            entry(0, 0);
          } catch (error) {
            if (terminalSent) {
              return;
            }
            terminalSent = true;
            cancelAllFetchRequests();
            activeWorkerId = null;
            activeCancellationRequested = false;
            activeFile = null;
            workerScope.postMessage({
              type: "error",
              workerId: message.workerId,
              text: describeError(error)
            });
            return;
          }
          if (terminalSent) {
            return;
          }
        }
        function cleanupTerminal() {
          terminalSent = true;
          cancelAllFetchRequests();
          activeWorkerId = null;
          activeCancellationRequested = false;
        }
        try {
          const response = await fetch(message.wasmUrl, {
            cache: "no-store",
            credentials: "same-origin"
          });
          if (!response.ok) {
            throw new Error(`Failed to load worker wasm from ${message.wasmUrl}.`);
          }
          const bytes = await response.arrayBuffer();
          const module2 = await WebAssembly.compile(bytes);
          const hostServices = loadWorkerHostServices(message.workerHostServices);
          validateWorkerImports(module2, hostServices);
          const instance = await WebAssembly.instantiate(module2, {
            env: {
              abort(_message, _fileName, line, column) {
                throw new Error(`Worker aborted at ${String(line ?? 0)}:${String(column ?? 0)}.`);
              }
            },
            fui_host_service: createHostServiceImportModule(hostServices, {
              readString: (ptr, len) => readUtf8(memory, ptr, len),
              writeString: (ptr, capacity, text, context) => writeUtf8(memory, ptr, capacity, text, context),
              readBytes: (ptr, len) => readBytes(memory, ptr, len),
              writeBytes: (ptr, capacity, bytes2, context) => writeBytes(memory, ptr, capacity, bytes2, context)
            }),
            fui_worker_host: {
              fui_worker_report_progress(ptr, len) {
                if (terminalSent) {
                  return;
                }
                workerScope.postMessage({
                  type: "progress",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_complete_string(ptr, len) {
                if (terminalSent) {
                  return;
                }
                cleanupTerminal();
                activeFile = null;
                workerScope.postMessage({
                  type: "complete",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_fail(ptr, len) {
                if (terminalSent) {
                  return;
                }
                cleanupTerminal();
                activeFile = null;
                workerScope.postMessage({
                  type: "error",
                  workerId: message.workerId,
                  text: readUtf8(memory, ptr, len)
                });
              },
              fui_worker_is_cancelled() {
                return readCancelFlag() ? 1 : 0;
              },
              fui_worker_request_yield() {
              },
              fui_worker_request_yield_delay() {
              },
              fui_file_read_chunk(offsetLow, offsetHigh, length) {
                if (activeFile === null) {
                  return 0;
                }
                const offset = Number(BigInt(offsetLow >>> 0) | BigInt(offsetHigh >>> 0) << 32n);
                const safeLength = Math.max(0, length | 0);
                if (offset >= activeFile.size || safeLength <= 0) {
                  return 0;
                }
                const blob = activeFile.slice(offset, Math.min(offset + safeLength, activeFile.size));
                const reader = new FileReaderSync();
                const buffer = reader.readAsArrayBuffer(blob);
                const readBytes2 = new Uint8Array(buffer);
                const written = readBytes2.length;
                if (written <= 0) {
                  return 0;
                }
                if (memory === null || callbackBufferSize <= 0) {
                  return 0;
                }
                if (written > callbackBufferSize) {
                  throw new Error("File chunk exceeds the worker callback buffer.");
                }
                new Uint8Array(memory.buffer, callbackBufferPtr, written).set(readBytes2);
                return written;
              },
              fui_file_worker_write_chunk(ptr, len) {
                if (memory === null || len <= 0) {
                  return;
                }
                const chunkBytes = new Uint8Array(len);
                chunkBytes.set(new Uint8Array(memory.buffer, ptr, len));
                const buffer = chunkBytes.buffer.slice(0, chunkBytes.byteLength);
                workerScope.postMessage({
                  type: "file-process-chunk",
                  workerId: message.workerId,
                  bytes: buffer
                }, [buffer]);
              }
            },
            fui_fetch_host: {
              fui_fetch_start(requestId, methodPtr, methodLen, urlPtr, urlLen, headersPtr, headersLen, bodyPtr, bodyLen) {
                const controller = new AbortController();
                const method = readUtf8(memory, methodPtr, methodLen);
                const url = readUtf8(memory, urlPtr, urlLen);
                const headerBytes = memory === null || headersLen <= 0 ? new Uint8Array(0) : new Uint8Array(memory.buffer.slice(headersPtr, headersPtr + headersLen));
                if (headerBytes.byteLength < 4 && headersLen > 0) {
                  throw new Error("Worker fetch header payload was truncated.");
                }
                const headers = new Headers();
                if (headerBytes.byteLength >= 4) {
                  const dataView = new DataView(headerBytes.buffer, headerBytes.byteOffset, headerBytes.byteLength);
                  let byteOffset = 0;
                  const count = dataView.getUint32(byteOffset, true);
                  byteOffset += 4;
                  const values = [];
                  for (let index = 0; index < count; index += 1) {
                    if (byteOffset + 4 > headerBytes.byteLength) {
                      throw new Error("Worker fetch header length was truncated.");
                    }
                    const partLen = dataView.getUint32(byteOffset, true);
                    byteOffset += 4;
                    if (byteOffset + partLen > headerBytes.byteLength) {
                      throw new Error("Worker fetch header value was truncated.");
                    }
                    values.push(partLen > 0 ? decoder.decode(headerBytes.subarray(byteOffset, byteOffset + partLen)) : "");
                    byteOffset += partLen;
                  }
                  if ((values.length & 1) != 0) {
                    throw new Error("Worker fetch headers were malformed.");
                  }
                  for (let index = 0; index < values.length; index += 2) {
                    headers.append(values[index] ?? "", values[index + 1] ?? "");
                  }
                }
                const bodyBytes = memory === null || bodyLen <= 0 ? new Uint8Array(0) : new Uint8Array(memory.buffer, bodyPtr, bodyLen);
                const body = bodyBytes.length > 0 ? bodyBytes : null;
                activeFetchRequests.set(requestId, controller);
                const init = {
                  method,
                  headers,
                  signal: controller.signal
                };
                if (body !== null) {
                  init.body = body;
                }
                void fetch(url, init).then((response2) => {
                  const active = activeFetchRequests.get(requestId);
                  if (active === void 0 || active !== controller || terminalSent) {
                    return;
                  }
                  activeFetchRequests.delete(requestId);
                  if (wasmExports === null) {
                    throw new Error("Worker fetch completed before wasm exports were ready.");
                  }
                  emitFetchComplete(requestId, response2.ok, response2.status, response2.statusText, response2.url, wasmExports);
                }).catch((error) => {
                  const active = activeFetchRequests.get(requestId);
                  if (active === void 0 || active !== controller) {
                    return;
                  }
                  activeFetchRequests.delete(requestId);
                  if (controller.signal.aborted || terminalSent) {
                    return;
                  }
                  if (wasmExports === null) {
                    throw new Error("Worker fetch failed before wasm exports were ready.");
                  }
                  emitFetchError(requestId, describeError(error), wasmExports);
                });
              },
              fui_fetch_cancel(requestId) {
                const controller = activeFetchRequests.get(requestId);
                if (controller === void 0) {
                  return;
                }
                activeFetchRequests.delete(requestId);
                controller.abort();
              }
            }
          });
          const exports2 = instance.exports;
          wasmExports = exports2;
          if (!(exports2.memory instanceof WebAssembly.Memory)) {
            throw new Error("Worker module did not export memory.");
          }
          memory = exports2.memory;
          if (typeof exports2.__fui_worker_text_buffer !== "function" || typeof exports2.__fui_worker_text_buffer_size !== "function") {
            throw new Error("Worker module did not export the fetch callback buffer.");
          }
          callbackBufferPtr = exports2.__fui_worker_text_buffer();
          callbackBufferSize = exports2.__fui_worker_text_buffer_size();
          const exportedEntry = exports2[message.entryName];
          if (typeof exportedEntry !== "function") {
            throw new Error(`Worker export "${message.entryName}" is missing.`);
          }
          entry = exportedEntry;
          runEntry();
        } catch (error) {
          cancelAllFetchRequests();
          activeWorkerId = null;
          activeCancellationRequested = false;
          activeFile = null;
          workerScope.postMessage({
            type: "error",
            workerId: message.workerId,
            text: describeError(error)
          });
        }
      }
      workerScope.onmessage = (event) => {
        const message = event.data;
        if (message.type === "start") {
          void startWorker(message);
          return;
        }
        if (message.type === "start-file-process") {
          void startFileProcessWorker(message);
          return;
        }
        if (activeWorkerId === message.workerId) {
          activeCancellationRequested = true;
          return;
        }
        pendingCancellationRequested = true;
      };
    }
  });
  require_worker_bootstrap();
})();
