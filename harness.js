// node_modules/@assemblyscript/loader/index.js
var ID_OFFSET = -8;
var SIZE_OFFSET = -4;
var ARRAYBUFFER_ID = 1;
var STRING_ID = 2;
var ARRAYBUFFERVIEW = 1 << 0;
var ARRAY = 1 << 1;
var STATICARRAY = 1 << 2;
var VAL_ALIGN_OFFSET = 6;
var VAL_SIGNED = 1 << 11;
var VAL_FLOAT = 1 << 12;
var VAL_MANAGED = 1 << 14;
var ARRAYBUFFERVIEW_BUFFER_OFFSET = 0;
var ARRAYBUFFERVIEW_DATASTART_OFFSET = 4;
var ARRAYBUFFERVIEW_BYTELENGTH_OFFSET = 8;
var ARRAYBUFFERVIEW_SIZE = 12;
var ARRAY_LENGTH_OFFSET = 12;
var ARRAY_SIZE = 16;
var E_NO_EXPORT_TABLE = "Operation requires compiling with --exportTable";
var E_NO_EXPORT_RUNTIME = "Operation requires compiling with --exportRuntime";
var F_NO_EXPORT_RUNTIME = () => {
  throw Error(E_NO_EXPORT_RUNTIME);
};
var BIGINT = typeof BigUint64Array !== "undefined";
var THIS = /* @__PURE__ */ Symbol();
var STRING_SMALLSIZE = 192;
var STRING_CHUNKSIZE = 1024;
var utf16 = new TextDecoder("utf-16le", { fatal: true });
Object.hasOwn = Object.hasOwn || function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
function getStringImpl(buffer, ptr) {
  let len = new Uint32Array(buffer)[ptr + SIZE_OFFSET >>> 2] >>> 1;
  const wtf16 = new Uint16Array(buffer, ptr, len);
  if (len <= STRING_SMALLSIZE) return String.fromCharCode(...wtf16);
  try {
    return utf16.decode(wtf16);
  } catch {
    let str = "", off = 0;
    while (len - off > STRING_CHUNKSIZE) {
      str += String.fromCharCode(...wtf16.subarray(off, off += STRING_CHUNKSIZE));
    }
    return str + String.fromCharCode(...wtf16.subarray(off));
  }
}
function preInstantiate(imports) {
  const extendedExports = {};
  function getString(memory, ptr) {
    if (!memory) return "<yet unknown>";
    return getStringImpl(memory.buffer, ptr);
  }
  const env = imports.env = imports.env || {};
  env.abort = env.abort || function abort(msg, file, line, colm) {
    const memory = extendedExports.memory || env.memory;
    throw Error(`abort: ${getString(memory, msg)} at ${getString(memory, file)}:${line}:${colm}`);
  };
  env.trace = env.trace || function trace(msg, n, ...args) {
    const memory = extendedExports.memory || env.memory;
    console.log(`trace: ${getString(memory, msg)}${n ? " " : ""}${args.slice(0, n).join(", ")}`);
  };
  env.seed = env.seed || Date.now;
  imports.Math = imports.Math || Math;
  imports.Date = imports.Date || Date;
  return extendedExports;
}
function postInstantiate(extendedExports, instance) {
  const exports = instance.exports;
  const memory = exports.memory;
  const table = exports.table;
  const __new = exports.__new || F_NO_EXPORT_RUNTIME;
  const __pin = exports.__pin || F_NO_EXPORT_RUNTIME;
  const __unpin = exports.__unpin || F_NO_EXPORT_RUNTIME;
  const __collect = exports.__collect || F_NO_EXPORT_RUNTIME;
  const __rtti_base = exports.__rtti_base;
  const getTypeinfoCount = __rtti_base ? (arr) => arr[__rtti_base >>> 2] : F_NO_EXPORT_RUNTIME;
  extendedExports.__new = __new;
  extendedExports.__pin = __pin;
  extendedExports.__unpin = __unpin;
  extendedExports.__collect = __collect;
  function getTypeinfo(id) {
    const U32 = new Uint32Array(memory.buffer);
    if ((id >>>= 0) >= getTypeinfoCount(U32)) throw Error(`invalid id: ${id}`);
    return U32[(__rtti_base + 4 >>> 2) + id];
  }
  function getArrayInfo(id) {
    const info = getTypeinfo(id);
    if (!(info & (ARRAYBUFFERVIEW | ARRAY | STATICARRAY))) throw Error(`not an array: ${id}, flags=${info}`);
    return info;
  }
  function getValueAlign(info) {
    return 31 - Math.clz32(info >>> VAL_ALIGN_OFFSET & 31);
  }
  function __newString(str) {
    if (str == null) return 0;
    const length = str.length;
    const ptr = __new(length << 1, STRING_ID);
    const U16 = new Uint16Array(memory.buffer);
    for (let i = 0, p = ptr >>> 1; i < length; ++i) U16[p + i] = str.charCodeAt(i);
    return ptr;
  }
  extendedExports.__newString = __newString;
  function __newArrayBuffer(buf) {
    if (buf == null) return 0;
    const bufview = new Uint8Array(buf);
    const ptr = __new(bufview.length, ARRAYBUFFER_ID);
    const U8 = new Uint8Array(memory.buffer);
    U8.set(bufview, ptr);
    return ptr;
  }
  extendedExports.__newArrayBuffer = __newArrayBuffer;
  function __getString(ptr) {
    if (!ptr) return null;
    const buffer = memory.buffer;
    const id = new Uint32Array(buffer)[ptr + ID_OFFSET >>> 2];
    if (id !== STRING_ID) throw Error(`not a string: ${ptr}`);
    return getStringImpl(buffer, ptr);
  }
  extendedExports.__getString = __getString;
  function getView(alignLog2, signed, float) {
    const buffer = memory.buffer;
    if (float) {
      switch (alignLog2) {
        case 2:
          return new Float32Array(buffer);
        case 3:
          return new Float64Array(buffer);
      }
    } else {
      switch (alignLog2) {
        case 0:
          return new (signed ? Int8Array : Uint8Array)(buffer);
        case 1:
          return new (signed ? Int16Array : Uint16Array)(buffer);
        case 2:
          return new (signed ? Int32Array : Uint32Array)(buffer);
        case 3:
          return new (signed ? BigInt64Array : BigUint64Array)(buffer);
      }
    }
    throw Error(`unsupported align: ${alignLog2}`);
  }
  function __newArray(id, valuesOrCapacity = 0) {
    const input = valuesOrCapacity;
    const info = getArrayInfo(id);
    const align = getValueAlign(info);
    const isArrayLike = typeof input !== "number";
    const length = isArrayLike ? input.length : input;
    const buf = __new(length << align, info & STATICARRAY ? id : ARRAYBUFFER_ID);
    let result;
    if (info & STATICARRAY) {
      result = buf;
    } else {
      __pin(buf);
      const arr = __new(info & ARRAY ? ARRAY_SIZE : ARRAYBUFFERVIEW_SIZE, id);
      __unpin(buf);
      const U32 = new Uint32Array(memory.buffer);
      U32[arr + ARRAYBUFFERVIEW_BUFFER_OFFSET >>> 2] = buf;
      U32[arr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2] = buf;
      U32[arr + ARRAYBUFFERVIEW_BYTELENGTH_OFFSET >>> 2] = length << align;
      if (info & ARRAY) U32[arr + ARRAY_LENGTH_OFFSET >>> 2] = length;
      result = arr;
    }
    if (isArrayLike) {
      const view = getView(align, info & VAL_SIGNED, info & VAL_FLOAT);
      const start = buf >>> align;
      if (info & VAL_MANAGED) {
        for (let i = 0; i < length; ++i) {
          view[start + i] = input[i];
        }
      } else {
        view.set(input, start);
      }
    }
    return result;
  }
  extendedExports.__newArray = __newArray;
  function __getArrayView(arr) {
    const U32 = new Uint32Array(memory.buffer);
    const id = U32[arr + ID_OFFSET >>> 2];
    const info = getArrayInfo(id);
    const align = getValueAlign(info);
    let buf = info & STATICARRAY ? arr : U32[arr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2];
    const length = info & ARRAY ? U32[arr + ARRAY_LENGTH_OFFSET >>> 2] : U32[buf + SIZE_OFFSET >>> 2] >>> align;
    return getView(align, info & VAL_SIGNED, info & VAL_FLOAT).subarray(buf >>>= align, buf + length);
  }
  extendedExports.__getArrayView = __getArrayView;
  function __getArray(arr) {
    const input = __getArrayView(arr);
    const len = input.length;
    const out = new Array(len);
    for (let i = 0; i < len; i++) out[i] = input[i];
    return out;
  }
  extendedExports.__getArray = __getArray;
  function __getArrayBuffer(ptr) {
    const buffer = memory.buffer;
    const length = new Uint32Array(buffer)[ptr + SIZE_OFFSET >>> 2];
    return buffer.slice(ptr, ptr + length);
  }
  extendedExports.__getArrayBuffer = __getArrayBuffer;
  function __getFunction(ptr) {
    if (!table) throw Error(E_NO_EXPORT_TABLE);
    const index = new Uint32Array(memory.buffer)[ptr >>> 2];
    return table.get(index);
  }
  extendedExports.__getFunction = __getFunction;
  function getTypedArray(Type, alignLog2, ptr) {
    return new Type(getTypedArrayView(Type, alignLog2, ptr));
  }
  function getTypedArrayView(Type, alignLog2, ptr) {
    const buffer = memory.buffer;
    const U32 = new Uint32Array(buffer);
    return new Type(
      buffer,
      U32[ptr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2],
      U32[ptr + ARRAYBUFFERVIEW_BYTELENGTH_OFFSET >>> 2] >>> alignLog2
    );
  }
  function attachTypedArrayFunctions(ctor, name, align) {
    extendedExports[`__get${name}`] = getTypedArray.bind(null, ctor, align);
    extendedExports[`__get${name}View`] = getTypedArrayView.bind(null, ctor, align);
  }
  [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ].forEach((ctor) => {
    attachTypedArrayFunctions(ctor, ctor.name, 31 - Math.clz32(ctor.BYTES_PER_ELEMENT));
  });
  if (BIGINT) {
    [BigUint64Array, BigInt64Array].forEach((ctor) => {
      attachTypedArrayFunctions(ctor, ctor.name.slice(3), 3);
    });
  }
  extendedExports.memory = extendedExports.memory || memory;
  extendedExports.table = extendedExports.table || table;
  return demangle(exports, extendedExports);
}
function isResponse(src) {
  return typeof Response !== "undefined" && src instanceof Response;
}
function isModule(src) {
  return src instanceof WebAssembly.Module;
}
async function instantiate(source, imports = {}) {
  if (isResponse(source = await source)) return instantiateStreaming(source, imports);
  const module = isModule(source) ? source : await WebAssembly.compile(source);
  const extended = preInstantiate(imports);
  const instance = await WebAssembly.instantiate(module, imports);
  const exports = postInstantiate(extended, instance);
  return { module, instance, exports };
}
async function instantiateStreaming(source, imports = {}) {
  if (!WebAssembly.instantiateStreaming) {
    return instantiate(
      isResponse(source = await source) ? source.arrayBuffer() : source,
      imports
    );
  }
  const extended = preInstantiate(imports);
  const result = await WebAssembly.instantiateStreaming(source, imports);
  const exports = postInstantiate(extended, result.instance);
  return { ...result, exports };
}
function demangle(exports, extendedExports = {}) {
  const setArgumentsLength = exports["__argumentsLength"] ? (length) => {
    exports["__argumentsLength"].value = length;
  } : exports["__setArgumentsLength"] || exports["__setargc"] || (() => {
  });
  for (let internalName of Object.keys(exports)) {
    const elem = exports[internalName];
    let parts = internalName.split(".");
    let curr = extendedExports;
    while (parts.length > 1) {
      let part = parts.shift();
      if (!Object.hasOwn(curr, part)) curr[part] = {};
      curr = curr[part];
    }
    let name = parts[0];
    let hash = name.indexOf("#");
    if (hash >= 0) {
      const className = name.substring(0, hash);
      const classElem = curr[className];
      if (typeof classElem === "undefined" || !classElem.prototype) {
        const ctor = function(...args) {
          return ctor.wrap(ctor.prototype.constructor(0, ...args));
        };
        ctor.prototype = {
          valueOf() {
            return this[THIS];
          }
        };
        ctor.wrap = function(thisValue) {
          return Object.create(ctor.prototype, { [THIS]: { value: thisValue, writable: false } });
        };
        if (classElem) Object.getOwnPropertyNames(classElem).forEach(
          (name2) => Object.defineProperty(ctor, name2, Object.getOwnPropertyDescriptor(classElem, name2))
        );
        curr[className] = ctor;
      }
      name = name.substring(hash + 1);
      curr = curr[className].prototype;
      if (/^(get|set):/.test(name)) {
        if (!Object.hasOwn(curr, name = name.substring(4))) {
          let getter = exports[internalName.replace("set:", "get:")];
          let setter = exports[internalName.replace("get:", "set:")];
          Object.defineProperty(curr, name, {
            get() {
              return getter(this[THIS]);
            },
            set(value) {
              setter(this[THIS], value);
            },
            enumerable: true
          });
        }
      } else {
        if (name === "constructor") {
          (curr[name] = function(...args) {
            setArgumentsLength(args.length);
            return elem(...args);
          }).original = elem;
        } else {
          (curr[name] = function(...args) {
            setArgumentsLength(args.length);
            return elem(this[THIS], ...args);
          }).original = elem;
        }
      }
    } else {
      if (/^(get|set):/.test(name)) {
        if (!Object.hasOwn(curr, name = name.substring(4))) {
          Object.defineProperty(curr, name, {
            get: exports[internalName.replace("set:", "get:")],
            set: exports[internalName.replace("get:", "set:")],
            enumerable: true
          });
        }
      } else if (typeof elem === "function" && elem !== setArgumentsLength) {
        (curr[name] = (...args) => {
          setArgumentsLength(args.length);
          return elem(...args);
        }).original = elem;
      } else {
        curr[name] = elem;
      }
    }
  }
  return extendedExports;
}

// node_modules/@effindomv2/runtime/src/managed-harness/host-events.ts
var IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
function hostEvent(definition) {
  return definition;
}
function defineHostEvents(events) {
  return events;
}
function assertIdentifier(value, context) {
  if (!IDENTIFIER_RE.test(value)) {
    throw new Error(`${context} "${value}" must be a valid identifier.`);
  }
}
function capitalize(value) {
  return value.length === 0 ? value : `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
function buildEventName(serviceName, methodName) {
  return `${serviceName}${capitalize(methodName)}`;
}
function buildExportName(eventName) {
  return `__fui_host_event_${eventName}`;
}
function validateEventType(type, context) {
  if (type === "string" || type === "bool" || type === "i32" || type === "u32" || type === "i64" || type === "u64" || type === "f64" || type === "bytes" || type === "i32_array" || type === "u32_array" || type === "i64_array" || type === "u64_array" || type === "f64_array") {
    return;
  }
  throw new Error(`${context} uses unsupported host-event type "${type}".`);
}
function listHostEventMethods(events) {
  if (events === void 0) {
    return [];
  }
  const methods = [];
  const seenEvents = /* @__PURE__ */ new Set();
  for (const [serviceName, serviceMethods] of Object.entries(events)) {
    assertIdentifier(serviceName, "Host event service");
    for (const [methodName, definition] of Object.entries(serviceMethods)) {
      assertIdentifier(methodName, `Host event ${serviceName} method`);
      const eventName = buildEventName(serviceName, methodName);
      if (seenEvents.has(eventName)) {
        throw new Error(`Duplicate host-event name "${eventName}".`);
      }
      seenEvents.add(eventName);
      const args = [...definition.args];
      args.forEach((type, index) => {
        validateEventType(type, `Host event ${serviceName}.${methodName} arg ${String(index)}`);
      });
      methods.push({
        serviceName,
        methodName,
        eventName,
        exportName: buildExportName(eventName),
        args,
        subscribe: definition.subscribe
      });
    }
  }
  methods.sort((left, right) => left.eventName.localeCompare(right.eventName));
  return methods;
}

// node_modules/@effindomv2/runtime/src/managed-harness/host-services.ts
var IDENTIFIER_RE2 = /^[A-Za-z_][A-Za-z0-9_]*$/;
function hostService(definition) {
  return definition;
}
function defineHostServices(services) {
  return services;
}
function assertIdentifier2(value, context) {
  if (!IDENTIFIER_RE2.test(value)) {
    throw new Error(`${context} "${value}" must be a valid identifier.`);
  }
}
function capitalize2(value) {
  return value.length === 0 ? value : `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
function buildImportName(serviceName, methodName) {
  return `${serviceName}${capitalize2(methodName)}`;
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
    assertIdentifier2(serviceName, "Host service");
    for (const [methodName, definition] of Object.entries(serviceMethods)) {
      assertIdentifier2(methodName, `Host service ${serviceName} method`);
      const importName = definition.importName ?? buildImportName(serviceName, methodName);
      assertIdentifier2(importName, `Host service ${serviceName}.${methodName} import`);
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

// node_modules/@effindomv2/runtime/src/managed-harness/worker-manager.ts
function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}
function createWorkerManager(options) {
  const workerBootstrapUrl = new URL("./worker-bootstrap.js", options.scriptBaseUrl).toString();
  const records = /* @__PURE__ */ new Map();
  function emitToSession(workerId, kind, text) {
    const session = options.getCurrentSession();
    if (session === null) {
      return;
    }
    try {
      const textLength = options.writeTextCallbackPayload(session, text, `Worker ${kind} payload`);
      const textPtr = textLength > 0 ? session.textBufferPtr : 0;
      if (kind === "progress") {
        session.exports.__fui_on_worker_progress(workerId, textPtr, textLength);
        return;
      }
      if (kind === "complete") {
        session.exports.__fui_on_worker_complete(workerId, textPtr, textLength);
        return;
      }
      session.exports.__fui_on_worker_error(workerId, textPtr, textLength);
    } catch (error) {
      console.error(`[fui-worker] failed to deliver ${kind} payload for worker ${String(workerId)}: ${describeError(error)}`);
      if (kind !== "error") {
        emitToSession(workerId, "error", `Worker ${kind} delivery failed: ${describeError(error)}`);
      }
    }
  }
  function finishWorker(workerId) {
    const record = records.get(workerId);
    if (record === void 0) {
      return;
    }
    record.worker?.terminate();
    records.delete(workerId);
  }
  function handleWorkerMessage(workerId, message) {
    const record = records.get(workerId);
    if (record === void 0) {
      return;
    }
    if (message.type === "progress") {
      if (!record.cancelled) {
        emitToSession(workerId, "progress", message.text);
      }
      return;
    }
    if (message.type === "complete") {
      emitToSession(workerId, "complete", message.text);
      finishWorker(workerId);
      return;
    }
    if (message.type === "file-process-chunk") {
      return;
    }
    emitToSession(workerId, "error", message.text);
    finishWorker(workerId);
  }
  function startWorker(workerId, wasmPath, entryName, input) {
    const record = records.get(workerId);
    if (record === void 0) {
      return;
    }
    try {
      const workerModuleUrl = new URL(wasmPath, options.scriptBaseUrl).toString();
      const worker = new Worker(workerBootstrapUrl);
      if (records.get(workerId) !== record) {
        worker.terminate();
        return;
      }
      record.worker = worker;
      worker.addEventListener("message", (event) => {
        handleWorkerMessage(workerId, event.data);
      });
      worker.addEventListener("error", (event) => {
        const active = records.get(workerId);
        if (active === void 0) {
          return;
        }
        const message2 = typeof event.message === "string" && event.message.length > 0 ? event.message : "Worker bootstrap crashed.";
        emitToSession(workerId, "error", message2);
        finishWorker(workerId);
      });
      const workerHostServices = options.getCurrentWorkerHostServices();
      const message = workerHostServices === void 0 ? {
        type: "start",
        workerId,
        wasmUrl: workerModuleUrl,
        entryName,
        input
      } : {
        type: "start",
        workerId,
        wasmUrl: workerModuleUrl,
        entryName,
        input,
        workerHostServices
      };
      worker.postMessage(message);
      if (record.cancelled) {
        worker.postMessage({
          type: "cancel",
          workerId
        });
      }
    } catch (error) {
      emitToSession(workerId, "error", describeError(error));
      finishWorker(workerId);
    }
  }
  return {
    startString(workerId, wasmPath, entryName, input) {
      if (records.has(workerId)) {
        emitToSession(workerId, "error", "Worker already started.");
        return;
      }
      records.set(workerId, {
        worker: null,
        cancelled: false
      });
      startWorker(workerId, wasmPath, entryName, input);
    },
    cancel(workerId) {
      const record = records.get(workerId);
      if (record === void 0) {
        return;
      }
      record.cancelled = true;
      if (record.worker !== null) {
        record.worker.postMessage({
          type: "cancel",
          workerId
        });
      }
    },
    terminateAll() {
      for (const record of records.values()) {
        record.worker?.terminate();
      }
      records.clear();
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/abi-version.ts
var EXPECTED_EFFINDOM_CORE_ABI_VERSION = 2;
var EXPECTED_EFFINDOM_UI_ABI_VERSION = 1;
function readAbiVersion(getter) {
  return typeof getter === "function" ? getter() : 0;
}
function assertCompatibleAbi(runtime) {
  const actualCoreVersion = readAbiVersion(runtime.core._ed_get_abi_version?.bind(runtime.core));
  const actualUiVersion = readAbiVersion(runtime.ui._ui_get_abi_version?.bind(runtime.ui));
  if (actualCoreVersion === EXPECTED_EFFINDOM_CORE_ABI_VERSION && actualUiVersion === EXPECTED_EFFINDOM_UI_ABI_VERSION) {
    return;
  }
  throw new Error(
    `EffinDom ABI mismatch: fui-as expects core ABI ${String(EXPECTED_EFFINDOM_CORE_ABI_VERSION)} and ui ABI ${String(EXPECTED_EFFINDOM_UI_ABI_VERSION)}, but loaded core ABI ${String(actualCoreVersion)} and ui ABI ${String(actualUiVersion)}. Rebuild/publish @effindomv2/runtime and @effindomv2/fui-as together.`
  );
}

// node_modules/@effindomv2/runtime/src/bridge/utils/encoding.ts
function extractHandlePrimitive(handle) {
  if (typeof handle === "bigint" || typeof handle === "number" || typeof handle === "string") {
    return handle;
  }
  const symbolPrimitive = handle[Symbol.toPrimitive]?.("default");
  if (typeof symbolPrimitive === "bigint" || typeof symbolPrimitive === "number" || typeof symbolPrimitive === "string") {
    return symbolPrimitive;
  }
  const primitive = handle.valueOf();
  if (typeof primitive === "bigint" || typeof primitive === "number" || typeof primitive === "string") {
    return primitive;
  }
  const stringified = handle.toString();
  if (typeof stringified === "string") {
    return stringified;
  }
  throw new TypeError(`Cannot convert ${String(handle)} to BigInt.`);
}
function handleToBigInt(handle) {
  const primitive = extractHandlePrimitive(handle);
  if (typeof primitive === "bigint") {
    return primitive;
  }
  if (typeof primitive === "number") {
    if (!Number.isInteger(primitive)) {
      throw new TypeError(`Cannot convert non-integer handle ${String(primitive)} to BigInt.`);
    }
    return BigInt(primitive);
  }
  if (typeof primitive === "string") {
    return BigInt(primitive);
  }
  throw new TypeError(`Cannot convert ${String(handle)} to BigInt.`);
}
function pointerToHeapOffset(pointer) {
  if (typeof pointer === "number") {
    if (!Number.isInteger(pointer)) {
      throw new TypeError(`Cannot convert non-integer pointer ${String(pointer)} to a heap offset.`);
    }
    return pointer;
  }
  const value = handleToBigInt(pointer);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Pointer ${value.toString()} exceeds JavaScript heap offset precision.`);
  }
  return Number(value);
}
function normalizePointerForWasm(module, pointer) {
  return module.usesMemory64 === true ? handleToBigInt(pointer) : pointerToHeapOffset(pointer);
}
function computeModifiers(event) {
  let modifiers = 0;
  if (event.shiftKey) {
    modifiers |= 1 << 0;
  }
  if (event.ctrlKey) {
    modifiers |= 1 << 1;
  }
  if (event.altKey) {
    modifiers |= 1 << 2;
  }
  if (event.metaKey) {
    modifiers |= 1 << 3;
  }
  return modifiers;
}

// node_modules/@effindomv2/runtime/src/bridge/events/canvas-geometry.ts
var DEFAULT_LOGICAL_WIDTH = 320;
var DEFAULT_LOGICAL_HEIGHT = 220;
function getCanvasSizeSource(canvas) {
  const source = canvas.closest("[data-effindom-canvas-size-source]");
  return source instanceof HTMLElement ? source : canvas;
}
function readCanvasLogicalSize(canvas) {
  const sizeSource = getCanvasSizeSource(canvas);
  if (sizeSource.clientWidth > 0 && sizeSource.clientHeight > 0) {
    return {
      width: sizeSource.clientWidth,
      height: sizeSource.clientHeight
    };
  }
  const styleWidth = Number.parseFloat(canvas.style.width);
  const styleHeight = Number.parseFloat(canvas.style.height);
  if (Number.isFinite(styleWidth) && styleWidth > 0 && Number.isFinite(styleHeight) && styleHeight > 0) {
    return { width: styleWidth, height: styleHeight };
  }
  return {
    width: canvas.clientWidth || DEFAULT_LOGICAL_WIDTH,
    height: canvas.clientHeight || DEFAULT_LOGICAL_HEIGHT
  };
}
function getPointerPosition(canvas, event) {
  const sizeSource = getCanvasSizeSource(canvas);
  const rect = sizeSource.getBoundingClientRect();
  const logicalSize = readCanvasLogicalSize(canvas);
  const contentLeft = rect.left + sizeSource.clientLeft;
  const contentTop = rect.top + sizeSource.clientTop;
  const displayWidth = sizeSource.clientWidth || rect.width - (sizeSource.clientLeft + sizeSource.clientLeft) || DEFAULT_LOGICAL_WIDTH;
  const displayHeight = sizeSource.clientHeight || rect.height - (sizeSource.clientTop + sizeSource.clientTop) || DEFAULT_LOGICAL_HEIGHT;
  const x = displayWidth > 0 ? (event.clientX - contentLeft) / displayWidth * logicalSize.width : 0;
  const y = displayHeight > 0 ? (event.clientY - contentTop) / displayHeight * logicalSize.height : 0;
  return { x, y };
}

// node_modules/@effindomv2/runtime/src/bridge/utils/heap.ts
var textEncoder = new TextEncoder();
function withHeapAllocation(module, byteLength, callback) {
  const ptr = normalizePointerForWasm(module, byteLength === 0 ? 0 : module._malloc(byteLength));
  const offset = pointerToHeapOffset(ptr);
  module.refreshHeapViews?.();
  if (byteLength > 0 && offset === 0) {
    throw new Error("WASM heap malloc failed.");
  }
  try {
    return callback({ ptr, offset, len: byteLength });
  } finally {
    if (offset !== 0) {
      module._free(ptr);
    }
  }
}
function copyBytesToHeap(module, ptr, bytes) {
  const offset = pointerToHeapOffset(normalizePointerForWasm(module, ptr));
  module.refreshHeapViews?.();
  if (bytes.byteLength > 0 && offset === 0) {
    throw new Error("WASM heap copy destination is null.");
  }
  if (bytes.byteLength > 0) {
    new Uint8Array(module.HEAPU8.buffer, offset, bytes.byteLength).set(bytes);
  }
  return offset;
}
function copyBytesFromHeap(module, ptr, byteLength) {
  if (byteLength <= 0) {
    return new Uint8Array(0);
  }
  const offset = pointerToHeapOffset(normalizePointerForWasm(module, ptr));
  module.refreshHeapViews?.();
  if (offset === 0) {
    throw new Error("WASM heap copy source is null.");
  }
  return new Uint8Array(new Uint8Array(module.HEAPU8.buffer, offset, byteLength));
}
function withHeapBytes(module, bytes, callback) {
  return withHeapAllocation(module, bytes.byteLength, (allocation) => {
    copyBytesToHeap(module, allocation.ptr, bytes);
    return callback(allocation);
  });
}
function writeBytesToHeap(module, bytes) {
  const allocation = allocateHeapBytes(module, bytes);
  return {
    ptr: allocation.ptr,
    offset: allocation.offset,
    len: bytes.byteLength,
    dispose: () => {
      if (allocation.offset !== 0) {
        module._free(allocation.ptr);
      }
    }
  };
}
function allocateHeapBytes(module, bytes) {
  const ptr = normalizePointerForWasm(module, bytes.byteLength === 0 ? 0 : module._malloc(bytes.byteLength));
  const offset = bytes.byteLength === 0 ? 0 : copyBytesToHeap(module, ptr, bytes);
  return { ptr, offset, len: bytes.byteLength };
}

// node_modules/@effindomv2/runtime/src/managed-harness/interop.ts
function toBigIntHandle(handle) {
  return handleToBigInt(handle);
}
function toNumberHandle(handle) {
  return pointerToHeapOffset(handle);
}
function zeroPointer(runtime) {
  return normalizePointerForWasm(runtime.ui, 0);
}
function normalizePointer(runtime, ptr) {
  return normalizePointerForWasm(runtime.ui, ptr);
}
function addUiPointer(runtime, ptr, byteOffset) {
  if (runtime.ui.usesMemory64 === true) {
    return toBigIntHandle(ptr) + BigInt(byteOffset);
  }
  return toNumberHandle(ptr) + byteOffset;
}
function currentInteractionTimeMs() {
  return BigInt(Math.floor(performance.now()));
}

// node_modules/@effindomv2/runtime/src/managed-harness/host-imports.ts
function createHostImportModule(deps) {
  function isPasswordTextInput(handle) {
    const metadata = deps.getRuntime().getTextInputMetadata(toBigIntHandle(handle).toString());
    return metadata?.kind === "password";
  }
  function isActivePasswordTextInput() {
    const activeHandle = deps.getRuntime().getActiveTextHandle();
    return activeHandle !== null && deps.getRuntime().getTextInputMetadata(activeHandle.toString())?.kind === "password";
  }
  function safeNotify(label, notify) {
    try {
      notify();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fui_host] ${label}: ${message}`);
    }
  }
  return {
    request_render() {
      const runtime = deps.getRuntime();
      deps.setAppFlushRequested(true);
      runtime.requestFrame();
      deps.queueHarnessFrame();
    },
    get_viewport_width() {
      const runtime = deps.getRuntime();
      const sizeSource = deps.uiChrome.getCanvasSizeSource(runtime.canvas);
      const rect = sizeSource.getBoundingClientRect();
      return sizeSource.clientWidth > 0 ? sizeSource.clientWidth : rect.width > 0 ? rect.width : runtime.canvas.width;
    },
    get_viewport_height() {
      const runtime = deps.getRuntime();
      const sizeSource = deps.uiChrome.getCanvasSizeSource(runtime.canvas);
      const rect = sizeSource.getBoundingClientRect();
      return sizeSource.clientHeight > 0 ? sizeSource.clientHeight : rect.height > 0 ? rect.height : runtime.canvas.height;
    },
    get_device_pixel_ratio() {
      return deps.platformHost.getDevicePixelRatio();
    },
    fui_set_pointer_capture(handle) {
      deps.getRuntime().setCapturedPointerHandle(toBigIntHandle(handle));
    },
    fui_release_pointer_capture() {
      deps.getRuntime().setCapturedPointerHandle(null);
    },
    fui_reload_page() {
      deps.platformHost.reload();
    },
    fui_can_navigate_back() {
      return deps.canBrowserNavigateBack() ? 1 : 0;
    },
    fui_can_navigate_forward() {
      return deps.canBrowserNavigateForward() ? 1 : 0;
    },
    fui_navigate_back() {
      deps.navigateBrowserBack();
    },
    fui_navigate_forward() {
      deps.navigateBrowserForward();
    },
    fui_copy_text(ptr, len) {
      const text = deps.readAppUtf8(ptr, len);
      deps.platformHost.publishClipboard({ plainText: text });
    },
    fui_has_text_selection_snapshot(handle) {
      if (isPasswordTextInput(handle)) {
        return 0;
      }
      return deps.textBridge.resolveFrozenOrLiveTextSelection(handle) !== null ? 1 : 0;
    },
    fui_freeze_text_selection_snapshot(handle) {
      if (isPasswordTextInput(handle)) {
        deps.textBridge.clearFrozenTextSelectionSnapshot();
        return;
      }
      deps.textBridge.freezeTextSelectionSnapshot(handle);
    },
    fui_copy_text_selection_snapshot(handle) {
      if (isPasswordTextInput(handle)) {
        return 0;
      }
      const snapshot = deps.textBridge.resolveFrozenOrLiveTextSelection(handle);
      if (snapshot === null) {
        return 0;
      }
      deps.platformHost.publishClipboard({
        plainText: snapshot.text.slice(snapshot.start, snapshot.end)
      });
      return 1;
    },
    fui_cut_focused_text_selection() {
      if (isActivePasswordTextInput()) {
        return 0;
      }
      const editor = deps.textBridge.getHiddenTextEditor();
      if (editor === null) {
        return 0;
      }
      const selectionStart = editor.selectionStart ?? 0;
      const selectionEnd = editor.selectionEnd ?? 0;
      if (selectionStart === selectionEnd) {
        return 0;
      }
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      deps.platformHost.publishClipboard({
        plainText: editor.value.slice(start, end)
      });
      editor.focus({ preventScroll: true });
      editor.setRangeText("", start, end, "start");
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteByCut", data: null }));
      return 1;
    },
    fui_cut_text_selection_snapshot(handle) {
      if (isPasswordTextInput(handle)) {
        deps.textBridge.clearFrozenTextSelectionSnapshot();
        return 0;
      }
      const runtime = deps.getRuntime();
      const snapshot = deps.textBridge.resolveFrozenOrLiveTextSelection(handle);
      if (snapshot === null) {
        return 0;
      }
      const { handleKey, text, start, end } = snapshot;
      deps.platformHost.publishClipboard({
        plainText: text.slice(start, end)
      });
      const updatedText = text.slice(0, start) + text.slice(end);
      const editor = deps.textBridge.getHiddenTextEditor();
      if (editor !== null) {
        editor.focus({ preventScroll: true });
        editor.value = updatedText;
        editor.setSelectionRange(start, start, "none");
      }
      deps.platformHost.defer(() => {
        runtime.ui._ui_request_focus(toBigIntHandle(handle));
        deps.textBridge.withUiUtf8("", (uiPtr, uiLen) => {
          runtime.ui._ui_replace_text_range(toBigIntHandle(handle), start, end, uiPtr, uiLen, start);
        });
        runtime.commitFrame();
        deps.queueHarnessFrame();
        deps.textBridge.updateLiveTextAfterCut(handleKey, updatedText, start);
        const activeEditor = deps.textBridge.getHiddenTextEditor();
        if (activeEditor !== null) {
          activeEditor.focus({ preventScroll: true });
          activeEditor.setSelectionRange(start, start, "none");
        }
      });
      deps.textBridge.clearFrozenTextSelectionSnapshot();
      return 1;
    },
    fui_cut_text_range_snapshot(handle, start, end) {
      if (isPasswordTextInput(handle)) {
        return 0;
      }
      const textSnapshot = deps.textBridge.resolveFrozenOrLiveTextSelection(handle);
      const handleKey = toBigIntHandle(handle).toString();
      const text = textSnapshot?.handleKey === handleKey ? textSnapshot.text : deps.textBridge.getLatestText(handle);
      const resolvedText = text.length > 0 ? text : "";
      if (resolvedText.length === 0) {
        return 0;
      }
      const rangeStart = Math.max(0, Math.min(start, end));
      const rangeEnd = Math.max(rangeStart, Math.min(resolvedText.length, Math.max(start, end)));
      if (rangeStart === rangeEnd) {
        return 0;
      }
      deps.platformHost.publishClipboard({
        plainText: resolvedText.slice(rangeStart, rangeEnd)
      });
      const updatedText = resolvedText.slice(0, rangeStart) + resolvedText.slice(rangeEnd);
      const editor = deps.textBridge.getHiddenTextEditor();
      if (editor !== null) {
        editor.focus({ preventScroll: true });
        editor.value = updatedText;
        editor.setSelectionRange(rangeStart, rangeStart, "none");
      }
      deps.platformHost.defer(() => {
        deps.getRuntime().ui._ui_request_focus(toBigIntHandle(handle));
        deps.textBridge.syncEditableTextToRuntime(handle, updatedText, rangeStart);
        deps.textBridge.updateLiveTextAfterCut(handleKey, updatedText, rangeStart);
        const activeEditor = deps.textBridge.getHiddenTextEditor();
        if (activeEditor !== null) {
          activeEditor.focus({ preventScroll: true });
          activeEditor.setSelectionRange(rangeStart, rangeStart, "none");
        }
      });
      return 1;
    },
    fui_delete_focused_text_range(start, end) {
      const editor = deps.textBridge.getHiddenTextEditor();
      if (editor === null) {
        return 0;
      }
      const rangeStart = Math.max(0, Math.min(start, end));
      const rangeEnd = Math.max(rangeStart, Math.max(start, end));
      editor.focus({ preventScroll: true });
      editor.setSelectionRange(rangeStart, rangeEnd);
      editor.setRangeText("", rangeStart, rangeEnd, "start");
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteByCut", data: null }));
      return 1;
    },
    fui_commit_text_action_focus(handle) {
      const runtime = deps.getRuntime();
      deps.platformHost.defer(() => {
        runtime.ui._ui_request_focus(toBigIntHandle(handle));
        runtime.commitFrame();
        deps.queueHarnessFrame();
        const editor = deps.textBridge.getHiddenTextEditor();
        if (editor !== null) {
          editor.focus({ preventScroll: true });
        }
      });
    },
    fui_register_text_input_metadata(handle, isPassword, hintPtr, hintLen) {
      const hostAutofillHint = hintLen > 0 ? deps.readAppUtf8(hintPtr, hintLen) : null;
      deps.getRuntime().setTextInputMetadata(toBigIntHandle(handle).toString(), {
        kind: isPassword ? "password" : hostAutofillHint === "email" ? "email" : "text",
        hostAutofillHint
      });
    },
    fui_load_svg(svgId, ptr, len) {
      const runtime = deps.getRuntime();
      const session = deps.getCurrentSessionOrNull();
      const url = deps.readAppUtf8(ptr, len);
      void runtime.loadSvg(svgId, url).then((result) => {
        if (deps.getCurrentSessionOrNull() !== session) {
          return;
        }
        safeNotify(`failed to deliver SVG ${String(svgId)} success callback`, () => {
          deps.notifySvgLoaded(session, svgId, result.width, result.height);
        });
      }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[fui_host] SVG ${String(svgId)} failed to load from ${url}: ${message}`);
        if (deps.getCurrentSessionOrNull() !== session) {
          return;
        }
        safeNotify(`failed to deliver SVG ${String(svgId)} failure callback`, () => {
          deps.notifySvgFailed(session, svgId, message);
        });
      });
    },
    fui_load_texture(textureId, ptr, len) {
      const runtime = deps.getRuntime();
      const session = deps.getCurrentSessionOrNull();
      const url = deps.readAppUtf8(ptr, len);
      void runtime.loadTexture(textureId, url).then((result) => {
        if (deps.getCurrentSessionOrNull() !== session) {
          return;
        }
        safeNotify(`failed to deliver texture ${String(textureId)} success callback`, () => {
          deps.notifyTextureLoaded(session, textureId, result.width, result.height);
        });
      }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[fui_host] texture ${String(textureId)} failed to load from ${url}: ${message}`);
        if (deps.getCurrentSessionOrNull() !== session) {
          return;
        }
        safeNotify(`failed to deliver texture ${String(textureId)} failure callback`, () => {
          deps.notifyTextureFailed(session, textureId, message);
        });
      });
    },
    fui_release_svg(svgId) {
      deps.getRuntime().releaseSvg(svgId);
    },
    fui_release_texture(textureId) {
      deps.getRuntime().releaseTexture(textureId);
    },
    fui_load_font(fontId, ptr, len) {
      const url = deps.readAppUtf8(ptr, len);
      deps.getRuntime().registerLazyFont(fontId, url);
    },
    fui_start_timer(timerId, delayMs) {
      deps.cancelHostTimer(timerId);
      const session = deps.getCurrentSessionOrNull();
      const clampedDelayMs = Math.max(0, Math.ceil(delayMs));
      const timeoutId = deps.platformHost.setTimer(() => {
        if (deps.getHostTimer(timerId) !== timeoutId) {
          return;
        }
        deps.deleteHostTimer(timerId);
        if (session === null || deps.getCurrentSessionOrNull() !== session) {
          return;
        }
        session.exports.__fui_on_timer(timerId);
      }, clampedDelayMs);
      deps.setHostTimer(timerId, timeoutId);
    },
    fui_cancel_timer(timerId) {
      deps.cancelHostTimer(timerId);
    },
    fui_now_ms() {
      return deps.platformHost.nowMilliseconds();
    },
    fui_worker_start_string(workerId, wasmPathPtr, wasmPathLen, entryPtr, entryLen, inputPtr, inputLen) {
      deps.workerManager.startString(
        workerId,
        deps.readAppUtf8(wasmPathPtr, wasmPathLen),
        deps.readAppUtf8(entryPtr, entryLen),
        deps.readAppUtf8(inputPtr, inputLen)
      );
    },
    fui_worker_cancel(workerId) {
      deps.workerManager.cancel(workerId);
    },
    fui_set_cursor(style) {
      if (deps.uiChrome.detectCoarsePointer()) {
        return;
      }
      const cursor = style === 1 ? "pointer" : style === 2 ? "text" : style === 3 ? "move" : style === 4 ? "grab" : style === 5 ? "grabbing" : style === 6 ? "ns-resize" : style === 7 ? "ew-resize" : "default";
      deps.getRuntime().canvas.style.cursor = cursor;
    },
    fui_is_dark_mode() {
      return deps.platformHost.isDarkMode() ? 1 : 0;
    },
    fui_get_accent_color() {
      return deps.uiChrome.readHostAccentColor();
    },
    fui_get_platform_family() {
      return deps.uiChrome.detectPlatformFamily();
    },
    fui_is_coarse_pointer() {
      return deps.uiChrome.detectCoarsePointer() ? 1 : 0;
    },
    fui_show_url_preview(ptr, len) {
      const rawTarget = deps.readAppUtf8(ptr, len);
      try {
        const resolvedTarget = deps.platformHost.resolveUrl(rawTarget);
        deps.uiChrome.setUrlPreviewText(resolvedTarget.href);
      } catch {
        deps.uiChrome.setUrlPreviewText(rawTarget);
      }
    },
    fui_hide_url_preview() {
      deps.uiChrome.setUrlPreviewText("");
    },
    fui_navigate_to(ptr, len, openInNewTab) {
      deps.navigateWithinDocument(deps.readAppUtf8(ptr, len), openInNewTab !== 0);
    },
    fui_set_persisted_scroll_offset(nodeIdPtr, nodeIdLen, x, y) {
      const nodeId = deps.readAppUtf8(nodeIdPtr, nodeIdLen);
      if (nodeId.length === 0) {
        return;
      }
      deps.persistedUiStateController.setCurrentPersistedScrollEntry(nodeId, x, y);
    },
    fui_try_get_persisted_scroll_offset(nodeIdPtr, nodeIdLen, outX, outY) {
      const nodeId = deps.readAppUtf8(nodeIdPtr, nodeIdLen);
      if (nodeId.length === 0) {
        return 0;
      }
      const payload = deps.persistedUiStateController.getCurrentPersistedScrollEntry(nodeId);
      if (payload === null) {
        return 0;
      }
      deps.writeAppFloat32(outX, payload.x);
      deps.writeAppFloat32(outY, payload.y);
      return 1;
    },
    fui_set_persisted_state(nodeIdPtr, nodeIdLen, kindPtr, kindLen, version, payloadPtr, payloadLen) {
      const nodeId = deps.readAppUtf8(nodeIdPtr, nodeIdLen);
      const kind = deps.readAppUtf8(kindPtr, kindLen);
      if (nodeId.length === 0 || kind.length === 0) {
        return;
      }
      deps.persistedUiStateController.setCurrentPersistedTextEntry(
        nodeId,
        kind,
        version >>> 0,
        deps.readAppUtf8(payloadPtr, payloadLen)
      );
    },
    fui_copy_persisted_state(nodeIdPtr, nodeIdLen, kindPtr, kindLen, outVersionPtr, payloadPtr, payloadCapacity) {
      const nodeId = deps.readAppUtf8(nodeIdPtr, nodeIdLen);
      const kind = deps.readAppUtf8(kindPtr, kindLen);
      if (nodeId.length === 0 || kind.length === 0) {
        return -1;
      }
      const entry = deps.persistedUiStateController.getCurrentPersistedTextEntry(nodeId, kind);
      if (entry === null) {
        return -1;
      }
      deps.writeAppUint32(outVersionPtr, entry.version >>> 0);
      const payloadBytes = new TextEncoder().encode(entry.payload);
      if (payloadBytes.length > payloadCapacity) {
        return payloadBytes.length;
      }
      deps.writeAppUtf8(payloadPtr, payloadCapacity, entry.payload, `Persisted state ${kind}`);
      return payloadBytes.length;
    },
    fui_log(catPtr, catLen, msgPtr, msgLen) {
      if (deps.getCurrentSessionOrNull() === null) {
        return;
      }
      const category = deps.readAppUtf8(catPtr, catLen);
      const message = deps.readAppUtf8(msgPtr, msgLen);
      const formatted = `[fui:${category}] ${message}`;
      if (category.startsWith("Warning/")) {
        console.warn(formatted);
        return;
      }
      if (category.startsWith("Error/")) {
        console.error(formatted);
        return;
      }
      if (deps.debugLogsEnabled) {
        console.debug(formatted);
      }
    },
    fui_logs_enabled() {
      return deps.debugLogsEnabled ? 1 : 0;
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-bitmap-host.ts
function createManagedHarnessBitmapHost(dependencies) {
  const customBitmapTextures = /* @__PURE__ */ new Map();
  const customBitmapReplayRuntimes = /* @__PURE__ */ new WeakSet();
  function uploadCustomBitmap(targetRuntime, textureId, record) {
    const textureBytes = writeBytesToHeap(targetRuntime.core, record.bytes);
    try {
      targetRuntime.core._ed_register_texture_rgba(
        textureId,
        textureBytes.ptr,
        record.width,
        record.height,
        textureBytes.len
      );
    } finally {
      textureBytes.dispose();
    }
  }
  function installReplay(targetRuntime) {
    if (customBitmapReplayRuntimes.has(targetRuntime)) {
      return;
    }
    const replayLoadedAssets = targetRuntime.replayLoadedAssets.bind(targetRuntime);
    targetRuntime.replayLoadedAssets = async () => {
      await replayLoadedAssets();
      for (const [textureId, record] of customBitmapTextures.entries()) {
        uploadCustomBitmap(targetRuntime, textureId, record);
      }
    };
    customBitmapReplayRuntimes.add(targetRuntime);
  }
  function clearTextures(targetRuntime) {
    for (const textureId of customBitmapTextures.keys()) {
      targetRuntime.core._ed_unregister_texture(textureId);
    }
    customBitmapTextures.clear();
  }
  return {
    installReplay,
    clearTextures,
    imports: {
      fui_bitmap_commit(textureId, ptr, len, width, height) {
        if (!Number.isInteger(textureId) || textureId <= 0) {
          throw new Error("Bitmap commit requires a non-zero texture ID.");
        }
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
          throw new Error("Bitmap commit requires positive integer dimensions.");
        }
        const expectedLength = width * height * 4;
        if (len !== expectedLength) {
          throw new Error(
            `Bitmap commit byte length mismatch: expected ${String(expectedLength)} bytes for ${String(width)}x${String(height)}, received ${String(len)}.`
          );
        }
        const record = {
          width,
          height,
          bytes: dependencies.readAppBytes(pointerToHeapOffset(ptr), len)
        };
        customBitmapTextures.set(textureId, record);
        uploadCustomBitmap(dependencies.getRuntime(), textureId, record);
        dependencies.notifyBitmapChanged();
      },
      fui_bitmap_commit_dirty(textureId, ptr, len, fullW, fullH, subX, subY, subW, subH) {
        if (!Number.isInteger(textureId) || textureId <= 0) return;
        if (subW <= 0 || subH <= 0) return;
        const expectedLen = subW * subH * 4;
        if (len !== expectedLen) return;
        const runtime = dependencies.getRuntime();
        const heap = writeBytesToHeap(runtime.core, dependencies.readAppBytes(pointerToHeapOffset(ptr), len));
        try {
          runtime.core._ed_register_texture_sub_rgba(
            textureId,
            heap.ptr,
            subX,
            subY,
            subW,
            subH,
            fullW,
            fullH
          );
        } finally {
          heap.dispose();
        }
        dependencies.notifyBitmapChanged();
      },
      fui_bitmap_release(textureId) {
        if (!Number.isInteger(textureId) || textureId <= 0) {
          return;
        }
        customBitmapTextures.delete(textureId);
        dependencies.getRuntime().core._ed_unregister_texture(textureId);
        dependencies.notifyBitmapChanged();
      },
      fui_render_node_to_rgba(handle, width, height, outPtr, outCapacity, scale, x, y) {
        const runtime = dependencies.getRuntime();
        const core = runtime.core;
        const byteCount = width * height * 4;
        if (outCapacity < byteCount) return 0;
        return withHeapAllocation(core, byteCount, (allocation) => {
          const written = core._ed_render_node_to_rgba(
            toBigIntHandle(handle),
            width,
            height,
            allocation.ptr,
            byteCount,
            scale,
            x,
            y
          );
          if (written === 0) {
            return 0;
          }
          const bytes = copyBytesFromHeap(core, allocation.ptr, byteCount);
          dependencies.writeAppBytes(pointerToHeapOffset(outPtr), byteCount, bytes, "bitmap-text-render");
          return written;
        });
      }
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-canvas-host.ts
function createManagedHarnessCanvasHost(deps) {
  const surfaces = /* @__PURE__ */ new Map();
  const canvasPointersByToken = /* @__PURE__ */ new Map();
  const canvasTokensByPointer = /* @__PURE__ */ new Map();
  const offscreenCanvasTokens = /* @__PURE__ */ new Map();
  let nextCanvasToken = 805306368;
  const core = () => deps.getRuntime().core;
  const ptr = (p) => {
    const token = pointerToHeapOffset(p);
    const canvasPtr = canvasPointersByToken.get(token);
    if (canvasPtr !== void 0) {
      return canvasPtr;
    }
    return normalizePointerForWasm(core(), p);
  };
  const pointerKey = (p) => normalizePointerForWasm(core(), p).toString();
  const tokenForCanvasPointer = (canvasPtr) => {
    const normalizedCanvasPtr = normalizePointerForWasm(core(), canvasPtr);
    const key = pointerKey(normalizedCanvasPtr);
    const existingToken = canvasTokensByPointer.get(key);
    if (existingToken !== void 0) {
      return existingToken;
    }
    const token = nextCanvasToken++;
    canvasTokensByPointer.set(key, token);
    canvasPointersByToken.set(token, normalizedCanvasPtr);
    return token;
  };
  const I = {};
  I.fui_canvas_save = (p) => {
    core()._ed_canvas_save(ptr(p));
  };
  I.fui_canvas_restore = (p) => {
    core()._ed_canvas_restore(ptr(p));
  };
  I.fui_canvas_translate = (p, x, y) => {
    core()._ed_canvas_translate(ptr(p), x, y);
  };
  I.fui_canvas_scale = (p, sx, sy) => {
    core()._ed_canvas_scale(ptr(p), sx, sy);
  };
  I.fui_canvas_rotate = (p, d) => {
    core()._ed_canvas_rotate(ptr(p), d);
  };
  I.fui_canvas_clip_rect = (p, x, y, w, h) => {
    core()._ed_canvas_clip_rect(ptr(p), x, y, w, h);
  };
  I.fui_canvas_clip_round_rect = (p, x, y, w, h, tl, tr, br, bl) => {
    core()._ed_canvas_clip_round_rect(ptr(p), x, y, w, h, tl, tr, br, bl);
  };
  I.fui_canvas_draw_rect = (p, x, y, w, h, fc, sc, sw) => {
    core()._ed_canvas_draw_rect(ptr(p), x, y, w, h, fc, sc, sw);
  };
  I.fui_canvas_draw_circle = (p, cx, cy, r, fc, sc, sw) => {
    core()._ed_canvas_draw_circle(ptr(p), cx, cy, r, fc, sc, sw);
  };
  I.fui_canvas_draw_line = (p, x1, y1, x2, y2, c, sw) => {
    core()._ed_canvas_draw_line(ptr(p), x1, y1, x2, y2, c, sw);
  };
  I.fui_canvas_draw_round_rect = (p, x, y, w, h, rx, ry, fc, sc, sw) => {
    core()._ed_canvas_draw_round_rect(ptr(p), x, y, w, h, rx, ry, fc, sc, sw);
  };
  I.fui_canvas_draw_path = (p, pid, fc, sc, sw) => {
    core()._ed_canvas_draw_path(ptr(p), pid, fc, sc, sw);
  };
  I.fui_canvas_draw_text_node = (p, lo, hi, x, y) => {
    core()._ed_canvas_draw_text_node(ptr(p), lo >>> 0, hi >>> 0, x, y);
  };
  I.fui_canvas_draw_image = (p, tid, x, y, w, h, sk, ma) => {
    core()._ed_canvas_draw_image(ptr(p), tid, x, y, w, h, sk, ma);
  };
  I.fui_canvas_draw_svg = (p, sid, x, y, w, h) => {
    core()._ed_canvas_draw_svg(ptr(p), sid, x, y, w, h);
  };
  I.fui_canvas_draw_batch = (p, wordsPtr, wordCount) => {
    if (wordCount <= 0) {
      return;
    }
    const wordByteLength = wordCount * 4;
    const words = deps.readAppBytes(pointerToHeapOffset(wordsPtr), wordByteLength);
    const c = core();
    withHeapBytes(c, words, (heap) => {
      c._ed_canvas_draw_batch(ptr(p), heap.ptr, wordCount);
    });
  };
  I.fui_path_create = () => core()._ed_path_create();
  I.fui_path_destroy = (id) => {
    core()._ed_path_destroy(id);
  };
  I.fui_path_move_to = (id, x, y) => {
    core()._ed_path_move_to(id, x, y);
  };
  I.fui_path_line_to = (id, x, y) => {
    core()._ed_path_line_to(id, x, y);
  };
  I.fui_path_quad_to = (id, cx, cy, x, y) => {
    core()._ed_path_quad_to(id, cx, cy, x, y);
  };
  I.fui_path_cubic_to = (id, cx1, cy1, cx2, cy2, x, y) => {
    core()._ed_path_cubic_to(id, cx1, cy1, cx2, cy2, x, y);
  };
  I.fui_path_close = (id) => {
    core()._ed_path_close(id);
  };
  I.fui_path_add_rect = (id, x, y, w, h) => {
    core()._ed_path_add_rect(id, x, y, w, h);
  };
  I.fui_path_add_circle = (id, cx, cy, r) => {
    core()._ed_path_add_circle(id, cx, cy, r);
  };
  I.fui_canvas_create_offscreen = (w, h) => {
    const id = core()._ed_canvas_create_offscreen(w, h);
    if (id !== 0) surfaces.set(id, id);
    return id;
  };
  I.fui_canvas_get_offscreen_ptr = (id) => {
    const existingToken = offscreenCanvasTokens.get(id);
    if (existingToken !== void 0) {
      return existingToken;
    }
    const token = tokenForCanvasPointer(core()._ed_canvas_get_offscreen_canvas(id));
    offscreenCanvasTokens.set(id, token);
    return token;
  };
  I.fui_canvas_read_offscreen_pixels = (id, outPtr, w, h) => {
    const bytesLen = w * h * 4;
    const c = core();
    withHeapAllocation(c, bytesLen, (heap) => {
      c._ed_canvas_read_offscreen_pixels(id, heap.ptr);
      deps.writeAppBytes(pointerToHeapOffset(outPtr), bytesLen, copyBytesFromHeap(c, heap.ptr, bytesLen), "canvas-read");
    });
  };
  I.fui_canvas_destroy_offscreen = (id) => {
    surfaces.delete(id);
    const token = offscreenCanvasTokens.get(id);
    if (token !== void 0) {
      offscreenCanvasTokens.delete(id);
      canvasPointersByToken.delete(token);
      for (const [key, value] of canvasTokensByPointer.entries()) {
        if (value === token) {
          canvasTokensByPointer.delete(key);
          break;
        }
      }
    }
    core()._ed_canvas_destroy_offscreen(id);
  };
  return { imports: I, tokenForCanvasPointer };
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-fetch-host.ts
var encoder = new TextEncoder();
function encodeLengthPrefixedText(value) {
  return encoder.encode(value);
}
function measureLengthPrefixedText(encoded) {
  return 4 + encoded.length;
}
function writeLengthPrefixedText(memory, basePtr, byteOffset, encoded) {
  const view = new DataView(memory.buffer, basePtr, byteOffset + 4 + encoded.length);
  view.setUint32(byteOffset, encoded.length >>> 0, true);
  let nextOffset = byteOffset + 4;
  if (encoded.length > 0) {
    new Uint8Array(memory.buffer, basePtr + nextOffset, encoded.length).set(encoded);
    nextOffset += encoded.length;
  }
  return nextOffset;
}
function writeTextPartsPayload(session, values, context) {
  const encodedValues = new Array(values.length);
  let totalBytes = 4;
  for (let index = 0; index < values.length; index += 1) {
    const encoded = encodeLengthPrefixedText(values[index] ?? "");
    encodedValues[index] = encoded;
    totalBytes += measureLengthPrefixedText(encoded);
  }
  if (totalBytes > session.textBufferSize) {
    throw new Error(`${context} exceeds the shared AssemblyScript text buffer.`);
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, values.length >>> 0, true);
  byteOffset += 4;
  for (const encoded of encodedValues) {
    byteOffset = writeLengthPrefixedText(session.memory, session.textBufferPtr, byteOffset, encoded);
  }
  return totalBytes;
}
function copyBytesToArrayBuffer(bytes) {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied.buffer;
}
function createManagedHarnessFetchHost(dependencies) {
  const activeFetchRequests = /* @__PURE__ */ new Map();
  function emitFetchComplete(session, requestId, ok, status, statusText, url) {
    if (session === null) {
      return;
    }
    const payloadLength = writeTextPartsPayload(
      session,
      [statusText, url],
      "Fetch completion payload"
    );
    session.exports.__fui_on_fetch_complete(
      requestId,
      ok,
      status,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFetchError(session, requestId, message) {
    if (session === null) {
      return;
    }
    const payloadLength = dependencies.writeTextCallbackPayload(session, message, "Fetch failure payload");
    session.exports.__fui_on_fetch_error(
      requestId,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function cancelAllForSession(session) {
    for (const [requestId, record] of activeFetchRequests.entries()) {
      if (session !== null && record.session !== session) {
        continue;
      }
      activeFetchRequests.delete(requestId);
      record.controller.abort();
    }
  }
  return {
    cancelAllForSession,
    imports: {
      fui_fetch_start(requestId, methodPtr, methodLen, urlPtr, urlLen, headersPtr, headersLen, bodyPtr, bodyLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const method = dependencies.readAppUtf8(methodPtr, methodLen);
        const url = dependencies.readAppUtf8(urlPtr, urlLen);
        const headerParts = dependencies.readAppTextParts(headersPtr, headersLen);
        if ((headerParts.length & 1) != 0) {
          emitFetchError(session, requestId, "Fetch request headers were malformed.");
          return;
        }
        const controller = new AbortController();
        const headers = new Headers();
        for (let index = 0; index < headerParts.length; index += 2) {
          headers.append(headerParts[index] ?? "", headerParts[index + 1] ?? "");
        }
        const bodyBytes = dependencies.readAppBytes(bodyPtr, bodyLen);
        activeFetchRequests.set(requestId, {
          requestId,
          session,
          controller
        });
        const init = {
          method,
          headers,
          signal: controller.signal
        };
        if (bodyBytes.length > 0) {
          init.body = copyBytesToArrayBuffer(bodyBytes);
        }
        void fetch(url, init).then((response) => {
          const active = activeFetchRequests.get(requestId);
          if (active?.session !== session) {
            return;
          }
          activeFetchRequests.delete(requestId);
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFetchComplete(
            session,
            requestId,
            response.ok,
            response.status,
            response.statusText,
            response.url
          );
        }).catch((error) => {
          const active = activeFetchRequests.get(requestId);
          if (active === void 0) {
            return;
          }
          activeFetchRequests.delete(requestId);
          if (controller.signal.aborted || dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFetchError(session, requestId, dependencies.describeHarnessError(error));
        });
      },
      fui_fetch_cancel(requestId) {
        const record = activeFetchRequests.get(requestId);
        if (record === void 0) {
          return;
        }
        activeFetchRequests.delete(requestId);
        record.controller.abort();
      }
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-file-payloads.ts
var encoder2 = new TextEncoder();
function encodeLengthPrefixedText2(value) {
  return encoder2.encode(value);
}
function measureLengthPrefixedText2(encoded) {
  return 4 + encoded.length;
}
function writeLengthPrefixedText2(memory, basePtr, byteOffset, encoded) {
  const view = new DataView(memory.buffer, basePtr, byteOffset + 4 + encoded.length);
  view.setUint32(byteOffset, encoded.length >>> 0, true);
  let nextOffset = byteOffset + 4;
  if (encoded.length > 0) {
    new Uint8Array(memory.buffer, basePtr + nextOffset, encoded.length).set(encoded);
    nextOffset += encoded.length;
  }
  return nextOffset;
}
function writeFileListPayload(session, files) {
  let totalBytes = 4;
  const encodedEntries = new Array();
  for (const entry of files) {
    const encodedId = encodeLengthPrefixedText2(entry.id);
    const encodedName = encodeLengthPrefixedText2(entry.file.name);
    const encodedMimeType = encodeLengthPrefixedText2(entry.file.type);
    encodedEntries.push({ entry, encodedId, encodedName, encodedMimeType });
    totalBytes += measureLengthPrefixedText2(encodedId) + 8 + 8 + measureLengthPrefixedText2(encodedName) + measureLengthPrefixedText2(encodedMimeType);
  }
  if (totalBytes > session.textBufferSize) {
    throw new Error("File picker payload exceeds the shared AssemblyScript text buffer.");
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, files.length >>> 0, true);
  byteOffset += 4;
  for (const { entry, encodedId, encodedName, encodedMimeType } of encodedEntries) {
    byteOffset = writeLengthPrefixedText2(session.memory, session.textBufferPtr, byteOffset, encodedId);
    dataView.setBigUint64(byteOffset, BigInt(entry.file.size), true);
    byteOffset += 8;
    dataView.setBigUint64(byteOffset, BigInt(Math.max(0, Math.trunc(entry.file.lastModified))), true);
    byteOffset += 8;
    byteOffset = writeLengthPrefixedText2(session.memory, session.textBufferPtr, byteOffset, encodedName);
    byteOffset = writeLengthPrefixedText2(session.memory, session.textBufferPtr, byteOffset, encodedMimeType);
  }
  return totalBytes;
}
function writeWriterPayload(session, mode, first, second = null) {
  const encodedFirst = encodeLengthPrefixedText2(first);
  const encodedSecond = second === null ? null : encodeLengthPrefixedText2(second);
  const totalBytes = 4 + measureLengthPrefixedText2(encodedFirst) + (encodedSecond === null ? 0 : measureLengthPrefixedText2(encodedSecond));
  if (totalBytes > session.textBufferSize) {
    throw new Error("File bridge metadata exceeds the shared AssemblyScript text buffer.");
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, mode >>> 0, true);
  byteOffset += 4;
  byteOffset = writeLengthPrefixedText2(session.memory, session.textBufferPtr, byteOffset, encodedFirst);
  if (encodedSecond !== null) {
    writeLengthPrefixedText2(session.memory, session.textBufferPtr, byteOffset, encodedSecond);
  }
  return totalBytes;
}
function writeExternalDropPayload(session, items) {
  let totalBytes = 4;
  const encodedItems = new Array();
  for (const item of items) {
    const encodedId = encoder2.encode(item.id);
    const encodedName = encoder2.encode(item.name);
    const encodedMimeType = encoder2.encode(item.mimeType ?? "");
    encodedItems.push({ item, encodedId, encodedName, encodedMimeType });
    totalBytes += 4 + 8 + 4 + encodedId.length + 4 + encodedName.length + 4 + encodedMimeType.length;
  }
  if (totalBytes > session.textBufferSize) {
    throw new Error("External drop payload exceeds the shared AssemblyScript text buffer.");
  }
  const dataView = new DataView(session.memory.buffer, session.textBufferPtr, totalBytes);
  let byteOffset = 0;
  dataView.setUint32(byteOffset, items.length >>> 0, true);
  byteOffset += 4;
  for (const { item, encodedId, encodedName, encodedMimeType } of encodedItems) {
    dataView.setUint32(byteOffset, item.kind >>> 0, true);
    byteOffset += 4;
    dataView.setFloat64(byteOffset, item.sizeBytes, true);
    byteOffset += 8;
    dataView.setUint32(byteOffset, encodedId.length >>> 0, true);
    byteOffset += 4;
    if (encodedId.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedId.length).set(encodedId);
      byteOffset += encodedId.length;
    }
    dataView.setUint32(byteOffset, encodedName.length >>> 0, true);
    byteOffset += 4;
    if (encodedName.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedName.length).set(encodedName);
      byteOffset += encodedName.length;
    }
    dataView.setUint32(byteOffset, encodedMimeType.length >>> 0, true);
    byteOffset += 4;
    if (encodedMimeType.length > 0) {
      new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encodedMimeType.length).set(encodedMimeType);
      byteOffset += encodedMimeType.length;
    }
  }
  return totalBytes;
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-file-types.ts
var EXTERNAL_DRAG_EVENT_ENTER = 1;
var EXTERNAL_DRAG_EVENT_OVER = 2;
var EXTERNAL_DRAG_EVENT_LEAVE = 3;
var EXTERNAL_DRAG_EVENT_DROP = 4;
var EXTERNAL_DROP_ITEM_KIND_FILE = 1;
var FILE_STATUS_SUCCESS = 1;
var FILE_STATUS_CANCELLED = 2;
var FILE_STATUS_ERROR = 3;
var FILE_SAVE_MODE_DOWNLOAD = 1;
var FILE_SAVE_MODE_NATIVE_PICKER = 2;
var FILE_CAPABILITY_OPEN = 1 << 0;
var FILE_CAPABILITY_READ = 1 << 1;
var FILE_CAPABILITY_SAVE = 1 << 2;
var FILE_CAPABILITY_CHUNKED_READ = 1 << 3;
var FILE_CAPABILITY_CHUNKED_WRITE = 1 << 4;
var FILE_CAPABILITY_NATIVE_SAVE_PICKER = 1 << 5;
var FILE_CAPABILITY_PROCESS_WORKER_SAVE = 1 << 6;

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness-file-host.ts
var encoder3 = new TextEncoder();
function isRecord(value) {
  return value !== null && typeof value === "object";
}
function parseFileProcessWorkerMessage(value) {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }
  if (value.type === "file-process-chunk" && (value.bytes instanceof Uint8Array || value.bytes instanceof ArrayBuffer)) {
    return { type: value.type, bytes: value.bytes };
  }
  if ((value.type === "progress" || value.type === "complete" || value.type === "error") && typeof value.text === "string") {
    return { type: value.type, text: value.text };
  }
  return null;
}
function copyBytesToArrayBuffer2(bytes) {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied.buffer;
}
function supportsNativeSavePicker() {
  return typeof window.showSaveFilePicker === "function";
}
function getFileCapabilities() {
  let flags = FILE_CAPABILITY_OPEN | FILE_CAPABILITY_READ | FILE_CAPABILITY_SAVE | FILE_CAPABILITY_CHUNKED_READ;
  if (supportsNativeSavePicker()) {
    flags |= FILE_CAPABILITY_CHUNKED_WRITE | FILE_CAPABILITY_NATIVE_SAVE_PICKER;
    flags |= FILE_CAPABILITY_PROCESS_WORKER_SAVE;
  }
  return flags;
}
function resolveSuggestedName(suggestedName, fileExtension) {
  const trimmedName = suggestedName.trim();
  const trimmedExtension = fileExtension.trim();
  if (trimmedName.length === 0) {
    if (trimmedExtension.length > 0) {
      return `export${trimmedExtension.startsWith(".") ? trimmedExtension : `.${trimmedExtension}`}`;
    }
    return "export.bin";
  }
  if (trimmedExtension.length === 0) {
    return trimmedName;
  }
  const normalizedExtension = trimmedExtension.startsWith(".") ? trimmedExtension : `.${trimmedExtension}`;
  return trimmedName.endsWith(normalizedExtension) ? trimmedName : `${trimmedName}${normalizedExtension}`;
}
async function abortWritableStream(stream) {
  if (typeof stream.abort === "function") {
    await stream.abort();
    return;
  }
  await stream.close();
}
function createManagedHarnessFileHost(dependencies) {
  let nextStoredBrowserFileId = 1;
  let nextFileWriterId = 1;
  let nextExternalDropItemId = 1;
  const storedBrowserFiles = /* @__PURE__ */ new Map();
  const activeFileWriters = /* @__PURE__ */ new Map();
  const activeFileProcessingRequests = /* @__PURE__ */ new Map();
  const cancelledFileProcessingRequestIds = /* @__PURE__ */ new Set();
  let activeExternalDropItems = [];
  function emitFilePickResult(session, requestId, status, files = [], message = "") {
    if (session === null) {
      return;
    }
    const payloadLength = status === FILE_STATUS_SUCCESS ? writeFileListPayload(session, files) : dependencies.writeTextCallbackPayload(session, message, "File picker result");
    session.exports.__fui_on_file_pick_result(
      requestId,
      status,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileReadResult(session, requestId, status, offsetBytes, fileSizeBytes, bytes = null, message = "") {
    if (session === null) {
      return;
    }
    let payloadLength;
    if (status === FILE_STATUS_SUCCESS) {
      payloadLength = bytes?.length ?? 0;
      if (payloadLength > session.textBufferSize) {
        throw new Error("File read result exceeds the shared AssemblyScript text buffer.");
      }
      if (payloadLength > 0 && bytes !== null) {
        new Uint8Array(session.memory.buffer, session.textBufferPtr, payloadLength).set(bytes);
      }
    } else {
      payloadLength = dependencies.writeTextCallbackPayload(session, message, "File read failure");
    }
    session.exports.__fui_on_file_read_result(
      requestId,
      status,
      offsetBytes,
      fileSizeBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileSaveResult(session, requestId, status, writtenBytes, fileName = "", mode = FILE_SAVE_MODE_DOWNLOAD, message = "") {
    if (session === null) {
      return;
    }
    const payloadLength = status === FILE_STATUS_SUCCESS ? writeWriterPayload(session, mode, fileName) : dependencies.writeTextCallbackPayload(session, message, "File save failure");
    session.exports.__fui_on_file_save_result(
      requestId,
      status,
      writtenBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileWriterCreated(session, requestId, status, writerId = "", fileName = "", mode = FILE_SAVE_MODE_NATIVE_PICKER, message = "") {
    if (session === null) {
      return;
    }
    const payloadLength = status === FILE_STATUS_SUCCESS ? writeWriterPayload(session, mode, writerId, fileName) : dependencies.writeTextCallbackPayload(session, message, "File writer creation failure");
    session.exports.__fui_on_file_writer_created(
      requestId,
      status,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileWriteResult(session, requestId, status, writtenBytes, totalWrittenBytes, message = "") {
    if (session === null) {
      return;
    }
    const payloadLength = status === FILE_STATUS_SUCCESS ? 0 : dependencies.writeTextCallbackPayload(session, message, "File write failure");
    session.exports.__fui_on_file_write_result(
      requestId,
      status,
      writtenBytes,
      totalWrittenBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileFinishResult(session, requestId, status, writtenBytes, fileName = "", mode = FILE_SAVE_MODE_NATIVE_PICKER, message = "") {
    if (session === null) {
      return;
    }
    const payloadLength = status === FILE_STATUS_SUCCESS ? writeWriterPayload(session, mode, fileName) : dependencies.writeTextCallbackPayload(session, message, "File writer finish failure");
    session.exports.__fui_on_file_finish_result(
      requestId,
      status,
      writtenBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileWorkerProcessProgress(session, requestId, processedBytes, totalBytes, outputFileName) {
    if (session === null) {
      return;
    }
    const payloadLength = dependencies.writeTextCallbackPayload(
      session,
      outputFileName ?? "",
      "File worker process progress"
    );
    session.exports.__fui_on_file_worker_process_progress(
      requestId,
      processedBytes,
      totalBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileWorkerProcessComplete(session, requestId, processedBytes, outputFileName, workerResult = null) {
    if (session === null) {
      return;
    }
    const combined = (outputFileName ?? "") + "\0" + (workerResult ?? "");
    const payloadLength = dependencies.writeTextCallbackPayload(
      session,
      combined,
      "File worker process completion"
    );
    session.exports.__fui_on_file_worker_process_complete(
      requestId,
      processedBytes,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function emitFileWorkerProcessError(session, requestId, status, message) {
    if (session === null) {
      return;
    }
    const payloadLength = dependencies.writeTextCallbackPayload(session, message, "File worker process failure");
    session.exports.__fui_on_file_worker_process_error(
      requestId,
      status,
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
  }
  function cleanupFileProcessingRequest(requestId) {
    cancelledFileProcessingRequestIds.delete(requestId);
    activeFileProcessingRequests.delete(requestId);
  }
  function failFileProcessingRequest(record, status, message) {
    record.failed = true;
    cleanupFileProcessingRequest(record.requestId);
    if (dependencies.getCurrentSession() === record.session) {
      emitFileWorkerProcessError(record.session, record.requestId, status, message);
    }
  }
  function isActiveFileProcessingRecord(record) {
    return activeFileProcessingRequests.get(record.requestId) === record && dependencies.getCurrentSession() === record.session && !record.cancelled && !record.failed;
  }
  function trackFileProcessingWrite(record, write) {
    record.pendingWrites.push(write);
    void write.finally(() => {
      const index = record.pendingWrites.indexOf(write);
      if (index >= 0) {
        void record.pendingWrites.splice(index, 1);
      }
    }).catch(() => {
    });
  }
  async function startFileProcessing(requestId, session, workerWasmPath, workerEntryName, sourceFile, suggestedName, chunkBytes, saveToPickedFile, workerHostServices) {
    const workerId = requestId;
    const resolvedWasmUrl = new URL(workerWasmPath, dependencies.workerBootstrapUrl).toString();
    const startProcessor = (targetFileName, stream) => {
      const worker = new Worker(dependencies.workerBootstrapUrl);
      const record = {
        requestId,
        session,
        sourceFileName: sourceFile.name,
        targetFileName,
        totalBytes: sourceFile.size,
        stream,
        saveToPickedFile,
        cancelled: false,
        failed: false,
        worker,
        pendingWrites: [],
        processedBytes: 0
      };
      activeFileProcessingRequests.set(requestId, record);
      worker.addEventListener("message", (event) => {
        const msg = parseFileProcessWorkerMessage(event.data);
        if (msg === null) {
          return;
        }
        if (msg.type === "file-process-chunk" && stream !== null) {
          const sourceBytes = msg.bytes instanceof Uint8Array ? msg.bytes : new Uint8Array(msg.bytes);
          const bytes = new Uint8Array(sourceBytes.byteLength);
          bytes.set(sourceBytes);
          const write = stream.write(bytes).catch((error) => {
            if (isActiveFileProcessingRecord(record)) {
              failFileProcessingRequest(record, FILE_STATUS_ERROR, dependencies.describeHarnessError(error));
            }
          });
          trackFileProcessingWrite(record, write);
        } else if (msg.type === "progress") {
          if (dependencies.getCurrentSession() === record.session) {
            const parts = msg.text.split(" ");
            const processed = parseInt(parts[0] ?? "0", 10);
            record.processedBytes = processed;
            emitFileWorkerProcessProgress(
              record.session,
              record.requestId,
              BigInt(processed),
              BigInt(record.totalBytes),
              record.targetFileName
            );
          }
        } else if (msg.type === "complete") {
          void Promise.all(record.pendingWrites).then(async () => {
            if (!isActiveFileProcessingRecord(record)) {
              return;
            }
            if (stream !== null) {
              await stream.close();
            }
            if (!isActiveFileProcessingRecord(record)) {
              return;
            }
            const hashText = msg.text;
            emitFileWorkerProcessComplete(
              record.session,
              record.requestId,
              BigInt(record.processedBytes),
              record.targetFileName,
              hashText
            );
            cleanupFileProcessingRequest(record.requestId);
          }).catch((error) => {
            if (isActiveFileProcessingRecord(record)) {
              failFileProcessingRequest(record, FILE_STATUS_ERROR, dependencies.describeHarnessError(error));
            }
          });
        } else if (msg.type === "error") {
          failFileProcessingRequest(record, FILE_STATUS_ERROR, msg.text);
        }
      });
      worker.addEventListener("error", () => {
        failFileProcessingRequest(record, FILE_STATUS_ERROR, "Worker crashed.");
      });
      worker.postMessage({
        type: "start-file-process",
        workerId,
        file: sourceFile,
        wasmUrl: resolvedWasmUrl,
        entryName: workerEntryName,
        chunkSize: Math.max(1, Math.floor(chunkBytes)),
        workerHostServices
      });
    };
    if (!saveToPickedFile) {
      startProcessor(null, null);
      return;
    }
    if (!supportsNativeSavePicker()) {
      emitFileWorkerProcessError(session, requestId, FILE_STATUS_ERROR, "Worker file processing requires the native save picker.");
      return;
    }
    const savePicker = window.showSaveFilePicker;
    if (typeof savePicker !== "function") {
      emitFileWorkerProcessError(session, requestId, FILE_STATUS_ERROR, "Worker file processing requires the native save picker.");
      return;
    }
    await savePicker({ suggestedName }).then(
      (handle) => handle.createWritable().then((writableStream) => {
        if (dependencies.getCurrentSession() !== session || cancelledFileProcessingRequestIds.has(requestId)) {
          void abortWritableStream(writableStream).catch(() => {
          });
          cancelledFileProcessingRequestIds.delete(requestId);
          return;
        }
        startProcessor(handle.name ?? suggestedName, writableStream);
      })
    ).catch((error) => {
      cancelledFileProcessingRequestIds.delete(requestId);
      if (dependencies.getCurrentSession() !== session) {
        return;
      }
      emitFileWorkerProcessError(
        session,
        requestId,
        error instanceof DOMException && error.name === "AbortError" ? FILE_STATUS_CANCELLED : FILE_STATUS_ERROR,
        dependencies.describeHarnessError(error)
      );
    });
  }
  function cancelFileProcessingRequest(requestId) {
    cancelledFileProcessingRequestIds.add(requestId);
    const record = activeFileProcessingRequests.get(requestId);
    if (record === void 0) {
      return;
    }
    record.cancelled = true;
    record.worker.terminate();
  }
  function storeBrowserFile(file, prefix) {
    const id = `${prefix}-${String(nextStoredBrowserFileId++)}`;
    storedBrowserFiles.set(id, file);
    return {
      id,
      file
    };
  }
  function snapshotStoredBrowserFile(file, prefix) {
    const stored = storeBrowserFile(file, prefix);
    return {
      id: stored.id,
      kind: EXTERNAL_DROP_ITEM_KIND_FILE,
      name: file.name,
      mimeType: file.type.length > 0 ? file.type : null,
      sizeBytes: file.size
    };
  }
  function clearActiveExternalDropItems() {
    activeExternalDropItems = [];
  }
  function snapshotExternalDropItems(dataTransfer) {
    if (dataTransfer === null) {
      return [];
    }
    const files = Array.from(dataTransfer.files);
    if (files.length > 0) {
      return files.map((file) => snapshotStoredBrowserFile(file, "external-drop"));
    }
    const itemEntries = Array.from(dataTransfer.items);
    const fileEntries = itemEntries.filter((item) => item.kind === "file");
    if (fileEntries.length > 0) {
      return fileEntries.map((item, index) => ({
        id: `external-drop-${String(nextExternalDropItemId++)}`,
        kind: EXTERNAL_DROP_ITEM_KIND_FILE,
        name: `Dropped file ${String(index + 1)}`,
        mimeType: item.type.length > 0 ? item.type : null,
        sizeBytes: 0
      }));
    }
    const dragTypes = Array.from(dataTransfer.types);
    if (dragTypes.includes("Files")) {
      return [{
        id: `external-drop-${String(nextExternalDropItemId++)}`,
        kind: EXTERNAL_DROP_ITEM_KIND_FILE,
        name: "Dropped file",
        mimeType: null,
        sizeBytes: 0
      }];
    }
    return [];
  }
  function getExternalDropItems(dataTransfer, reuseActive) {
    if (reuseActive && activeExternalDropItems.length > 0) {
      return activeExternalDropItems;
    }
    const items = snapshotExternalDropItems(dataTransfer);
    activeExternalDropItems = items;
    return items;
  }
  function mapExternalDropEffect(effect) {
    if ((effect & 2) !== 0) {
      return "move";
    }
    if ((effect & 1) !== 0) {
      return "copy";
    }
    if ((effect & 4) !== 0) {
      return "link";
    }
    return "none";
  }
  function dispatchExternalDragEvent(eventType, event, options = {}) {
    const session = dependencies.getCurrentSession();
    if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
      if (eventType === EXTERNAL_DRAG_EVENT_LEAVE || eventType === EXTERNAL_DRAG_EVENT_DROP) {
        clearActiveExternalDropItems();
      }
      return 0;
    }
    const items = eventType === EXTERNAL_DRAG_EVENT_LEAVE ? activeExternalDropItems : getExternalDropItems(
      event.dataTransfer,
      eventType === EXTERNAL_DRAG_EVENT_DROP ? false : options.reuseActiveItems !== false
    );
    if (items.length === 0 && eventType !== EXTERNAL_DRAG_EVENT_LEAVE) {
      return 0;
    }
    const runtime = dependencies.getRuntime();
    const position = getPointerPosition(runtime.canvas, event);
    const handle = options.handle ?? runtime.getHandleFromPoint(position.x, position.y);
    const payloadLength = items.length > 0 ? writeExternalDropPayload(session, items) : 0;
    const effect = session.exports.__fui_on_external_drag_event(
      eventType,
      handle,
      position.x,
      position.y,
      computeModifiers(event),
      payloadLength > 0 ? session.textBufferPtr : 0,
      payloadLength
    );
    if (eventType === EXTERNAL_DRAG_EVENT_LEAVE || eventType === EXTERNAL_DRAG_EVENT_DROP) {
      clearActiveExternalDropItems();
    }
    return effect;
  }
  function cancelAllForSession(session) {
    clearActiveExternalDropItems();
    for (const [writerId, record] of activeFileWriters.entries()) {
      if (session !== null && record.session !== session) {
        continue;
      }
      activeFileWriters.delete(writerId);
      void abortWritableStream(record.stream).catch(() => {
      });
    }
    for (const [requestId, record] of activeFileProcessingRequests.entries()) {
      if (session !== null && record.session !== session) {
        continue;
      }
      cancelFileProcessingRequest(requestId);
    }
  }
  return {
    cancelAllForSession,
    dispatchExternalDragEvent,
    mapExternalDropEffect,
    imports: {
      fui_file_capabilities() {
        return getFileCapabilities();
      },
      fui_file_pick(requestId, acceptPtr, acceptLen, multiple) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const accept = dependencies.readAppUtf8(acceptPtr, acceptLen);
        const host = document.body;
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = multiple;
        if (accept.length > 0) {
          input.accept = accept;
        }
        input.tabIndex = -1;
        input.style.position = "fixed";
        input.style.left = "-10000px";
        input.style.top = "0";
        input.style.opacity = "0";
        host.appendChild(input);
        let finished = false;
        const complete = (status, files = [], message = "") => {
          if (finished) {
            return;
          }
          finished = true;
          input.remove();
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFilePickResult(session, requestId, status, files, message);
        };
        input.addEventListener("change", () => {
          const selected = Array.from(input.files ?? []).map((file) => storeBrowserFile(file, "picked-file"));
          if (selected.length > 0) {
            complete(FILE_STATUS_SUCCESS, selected);
            return;
          }
          complete(FILE_STATUS_CANCELLED, [], "File picker cancelled.");
        }, { once: true });
        input.addEventListener("cancel", () => {
          complete(FILE_STATUS_CANCELLED, [], "File picker cancelled.");
        }, { once: true });
        input.click();
      },
      fui_file_read_chunk(requestId, fileIdPtr, fileIdLen, offsetBytes, maxBytes) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const fileId = dependencies.readAppUtf8(fileIdPtr, fileIdLen);
        const sourceFile = storedBrowserFiles.get(fileId);
        if (sourceFile === void 0) {
          emitFileReadResult(session, requestId, FILE_STATUS_ERROR, 0n, 0n, null, `Unknown browser file "${fileId}".`);
          return;
        }
        const numericOffset = typeof offsetBytes === "bigint" ? Number(offsetBytes) : offsetBytes;
        if (!Number.isFinite(numericOffset) || numericOffset < 0) {
          emitFileReadResult(session, requestId, FILE_STATUS_ERROR, 0n, BigInt(sourceFile.size), null, "File read offset was invalid.");
          return;
        }
        const safeOffset = Math.min(sourceFile.size, Math.floor(numericOffset));
        const clampedMaxBytes = Math.max(1, Math.min(Math.floor(maxBytes), session.textBufferSize));
        void sourceFile.slice(safeOffset, safeOffset + clampedMaxBytes).arrayBuffer().then((buffer) => {
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFileReadResult(
            session,
            requestId,
            FILE_STATUS_SUCCESS,
            BigInt(safeOffset),
            BigInt(sourceFile.size),
            new Uint8Array(buffer)
          );
        }).catch((error) => {
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFileReadResult(
            session,
            requestId,
            FILE_STATUS_ERROR,
            BigInt(safeOffset),
            BigInt(sourceFile.size),
            null,
            error instanceof Error ? error.message : String(error)
          );
        });
      },
      fui_file_save_text(requestId, suggestedNamePtr, suggestedNameLen, mimeTypePtr, mimeTypeLen, fileExtensionPtr, fileExtensionLen, textPtr, textLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const suggestedName = resolveSuggestedName(
          dependencies.readAppUtf8(suggestedNamePtr, suggestedNameLen),
          dependencies.readAppUtf8(fileExtensionPtr, fileExtensionLen)
        );
        const mimeType = dependencies.readAppUtf8(mimeTypePtr, mimeTypeLen);
        const text = dependencies.readAppUtf8(textPtr, textLen);
        const encoded = encoder3.encode(text);
        const finishDownload = () => {
          const blob = mimeType.length > 0 ? new Blob([encoded], { type: mimeType }) : new Blob([encoded]);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = suggestedName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 0);
          if (dependencies.getCurrentSession() === session) {
            emitFileSaveResult(session, requestId, FILE_STATUS_SUCCESS, BigInt(encoded.length), suggestedName, FILE_SAVE_MODE_DOWNLOAD);
          }
        };
        const savePicker = window.showSaveFilePicker;
        if (typeof savePicker !== "function") {
          finishDownload();
          return;
        }
        void savePicker({ suggestedName }).then((handle) => handle.createWritable().then(async (stream) => {
          await stream.write(text);
          await stream.close();
          if (dependencies.getCurrentSession() === session) {
            emitFileSaveResult(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              BigInt(encoded.length),
              handle.name ?? suggestedName,
              FILE_SAVE_MODE_NATIVE_PICKER
            );
          }
        })).catch((error) => {
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFileSaveResult(
            session,
            requestId,
            error instanceof DOMException && error.name === "AbortError" ? FILE_STATUS_CANCELLED : FILE_STATUS_ERROR,
            0n,
            "",
            FILE_SAVE_MODE_NATIVE_PICKER,
            error instanceof Error ? error.message : String(error)
          );
        });
      },
      fui_file_save_bytes(requestId, suggestedNamePtr, suggestedNameLen, mimeTypePtr, mimeTypeLen, fileExtensionPtr, fileExtensionLen, bytesPtr, bytesLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const suggestedName = resolveSuggestedName(
          dependencies.readAppUtf8(suggestedNamePtr, suggestedNameLen),
          dependencies.readAppUtf8(fileExtensionPtr, fileExtensionLen)
        );
        const mimeType = dependencies.readAppUtf8(mimeTypePtr, mimeTypeLen);
        const bytes = dependencies.readAppBytes(bytesPtr, bytesLen);
        const copiedBytes = copyBytesToArrayBuffer2(bytes);
        const finishDownload = () => {
          const blob = mimeType.length > 0 ? new Blob([copiedBytes], { type: mimeType }) : new Blob([copiedBytes]);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = suggestedName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 0);
          if (dependencies.getCurrentSession() === session) {
            emitFileSaveResult(session, requestId, FILE_STATUS_SUCCESS, BigInt(bytes.length), suggestedName, FILE_SAVE_MODE_DOWNLOAD);
          }
        };
        const savePicker = window.showSaveFilePicker;
        if (typeof savePicker !== "function") {
          finishDownload();
          return;
        }
        void savePicker({ suggestedName }).then((handle) => handle.createWritable().then(async (stream) => {
          await stream.write(copiedBytes);
          await stream.close();
          if (dependencies.getCurrentSession() === session) {
            emitFileSaveResult(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              BigInt(bytes.length),
              handle.name ?? suggestedName,
              FILE_SAVE_MODE_NATIVE_PICKER
            );
          }
        })).catch((error) => {
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFileSaveResult(
            session,
            requestId,
            error instanceof DOMException && error.name === "AbortError" ? FILE_STATUS_CANCELLED : FILE_STATUS_ERROR,
            0n,
            "",
            FILE_SAVE_MODE_NATIVE_PICKER,
            error instanceof Error ? error.message : String(error)
          );
        });
      },
      fui_file_create_writer(requestId, suggestedNamePtr, suggestedNameLen, _mimeTypePtr, _mimeTypeLen, fileExtensionPtr, fileExtensionLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const savePicker = window.showSaveFilePicker;
        if (typeof savePicker !== "function") {
          emitFileWriterCreated(session, requestId, FILE_STATUS_ERROR, "", "", FILE_SAVE_MODE_NATIVE_PICKER, "Chunked file writers require the native save picker.");
          return;
        }
        const suggestedName = resolveSuggestedName(
          dependencies.readAppUtf8(suggestedNamePtr, suggestedNameLen),
          dependencies.readAppUtf8(fileExtensionPtr, fileExtensionLen)
        );
        void savePicker({ suggestedName }).then((handle) => handle.createWritable().then((stream) => {
          const writerId = `writer-${String(nextFileWriterId++)}`;
          activeFileWriters.set(writerId, {
            id: writerId,
            session,
            fileName: handle.name ?? suggestedName,
            mode: FILE_SAVE_MODE_NATIVE_PICKER,
            stream,
            writtenBytes: 0
          });
          if (dependencies.getCurrentSession() === session) {
            emitFileWriterCreated(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              writerId,
              handle.name ?? suggestedName,
              FILE_SAVE_MODE_NATIVE_PICKER
            );
          }
        })).catch((error) => {
          if (dependencies.getCurrentSession() !== session) {
            return;
          }
          emitFileWriterCreated(
            session,
            requestId,
            error instanceof DOMException && error.name === "AbortError" ? FILE_STATUS_CANCELLED : FILE_STATUS_ERROR,
            "",
            "",
            FILE_SAVE_MODE_NATIVE_PICKER,
            error instanceof Error ? error.message : String(error)
          );
        });
      },
      fui_file_writer_write_text(requestId, writerIdPtr, writerIdLen, textPtr, textLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const writerId = dependencies.readAppUtf8(writerIdPtr, writerIdLen);
        const record = activeFileWriters.get(writerId);
        if (record === void 0) {
          emitFileWriteResult(session, requestId, FILE_STATUS_ERROR, 0n, 0n, `Unknown file writer "${writerId}".`);
          return;
        }
        const text = dependencies.readAppUtf8(textPtr, textLen);
        const encodedLength = encoder3.encode(text).length;
        void record.stream.write(text).then(() => {
          record.writtenBytes += encodedLength;
          if (dependencies.getCurrentSession() === session) {
            emitFileWriteResult(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              BigInt(encodedLength),
              BigInt(record.writtenBytes)
            );
          }
        }).catch((error) => {
          if (dependencies.getCurrentSession() === session) {
            emitFileWriteResult(session, requestId, FILE_STATUS_ERROR, 0n, BigInt(record.writtenBytes), error instanceof Error ? error.message : String(error));
          }
        });
      },
      fui_file_writer_write_bytes(requestId, writerIdPtr, writerIdLen, bytesPtr, bytesLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const writerId = dependencies.readAppUtf8(writerIdPtr, writerIdLen);
        const record = activeFileWriters.get(writerId);
        if (record === void 0) {
          emitFileWriteResult(session, requestId, FILE_STATUS_ERROR, 0n, 0n, `Unknown file writer "${writerId}".`);
          return;
        }
        const bytes = dependencies.readAppBytes(bytesPtr, bytesLen);
        const copiedBytes = copyBytesToArrayBuffer2(bytes);
        void record.stream.write(copiedBytes).then(() => {
          record.writtenBytes += bytes.length;
          if (dependencies.getCurrentSession() === session) {
            emitFileWriteResult(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              BigInt(bytes.length),
              BigInt(record.writtenBytes)
            );
          }
        }).catch((error) => {
          if (dependencies.getCurrentSession() === session) {
            emitFileWriteResult(session, requestId, FILE_STATUS_ERROR, 0n, BigInt(record.writtenBytes), error instanceof Error ? error.message : String(error));
          }
        });
      },
      fui_file_writer_finish(requestId, writerIdPtr, writerIdLen) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const writerId = dependencies.readAppUtf8(writerIdPtr, writerIdLen);
        const record = activeFileWriters.get(writerId);
        if (record === void 0) {
          emitFileFinishResult(session, requestId, FILE_STATUS_ERROR, 0n, "", FILE_SAVE_MODE_NATIVE_PICKER, `Unknown file writer "${writerId}".`);
          return;
        }
        activeFileWriters.delete(writerId);
        void record.stream.close().then(() => {
          if (dependencies.getCurrentSession() === session) {
            emitFileFinishResult(
              session,
              requestId,
              FILE_STATUS_SUCCESS,
              BigInt(record.writtenBytes),
              record.fileName,
              record.mode
            );
          }
        }).catch((error) => {
          if (dependencies.getCurrentSession() === session) {
            emitFileFinishResult(
              session,
              requestId,
              FILE_STATUS_ERROR,
              BigInt(record.writtenBytes),
              "",
              record.mode,
              error instanceof Error ? error.message : String(error)
            );
          }
        });
      },
      fui_file_process_worker_start(requestId, workerWasmPathPtr, workerWasmPathLen, workerEntryPtr, workerEntryLen, fileIdPtr, fileIdLen, suggestedNamePtr, suggestedNameLen, chunkBytes, saveToPickedFile) {
        const session = dependencies.getCurrentSession();
        if (session === null) {
          return;
        }
        const workerWasmPath = dependencies.readAppUtf8(workerWasmPathPtr, workerWasmPathLen);
        const workerEntryName = dependencies.readAppUtf8(workerEntryPtr, workerEntryLen);
        const fileId = dependencies.readAppUtf8(fileIdPtr, fileIdLen);
        const sourceFile = storedBrowserFiles.get(fileId);
        if (sourceFile === void 0) {
          emitFileWorkerProcessError(session, requestId, FILE_STATUS_ERROR, `Unknown browser file "${fileId}".`);
          return;
        }
        const suggestedName = resolveSuggestedName(dependencies.readAppUtf8(suggestedNamePtr, suggestedNameLen), "");
        const workerHostServices = dependencies.getCurrentWorkerHostServices();
        void startFileProcessing(requestId, session, workerWasmPath, workerEntryName, sourceFile, suggestedName, chunkBytes, saveToPickedFile, workerHostServices);
      },
      fui_file_process_worker_cancel(requestId) {
        cancelFileProcessingRequest(requestId);
      }
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/managed-history.ts
var managedHistoryInitialized = false;
var managedHistoryEntries = [];
var managedHistoryIndex = 0;
function normalizeManagedHistoryState(rawState, currentUrl) {
  const rawRecord = typeof rawState === "object" && rawState !== null ? rawState : null;
  const href = typeof rawRecord?.href === "string" && rawRecord.href.length > 0 ? rawRecord.href : currentUrl.href;
  const snapshotId = typeof rawRecord?.uiSnapshotId === "string" && rawRecord.uiSnapshotId.length > 0 ? rawRecord.uiSnapshotId : void 0;
  return snapshotId === void 0 ? { href } : { href, uiSnapshotId: snapshotId };
}
function readManagedHistoryState(currentUrl = new URL(window.location.href)) {
  return normalizeManagedHistoryState(window.history.state, currentUrl);
}
function writeManagedHistoryState(state, mode) {
  if (mode === "push") {
    window.history.pushState(state, "", state.href);
    return;
  }
  window.history.replaceState(state, "", state.href);
}
function setCurrentManagedHistorySnapshotId(snapshotId, currentUrl = new URL(window.location.href)) {
  const state = snapshotId === void 0 ? { href: currentUrl.href } : { href: currentUrl.href, uiSnapshotId: snapshotId };
  writeManagedHistoryState(state, "replace");
  return state;
}
function ensureManagedHistoryInitialized() {
  const currentUrl = new URL(window.location.href);
  if (managedHistoryInitialized) {
    const normalizedState2 = readManagedHistoryState(currentUrl);
    writeManagedHistoryState(
      normalizedState2.href === currentUrl.href ? normalizedState2 : normalizedState2.uiSnapshotId === void 0 ? { href: currentUrl.href } : { href: currentUrl.href, uiSnapshotId: normalizedState2.uiSnapshotId },
      "replace"
    );
    return;
  }
  managedHistoryEntries = [currentUrl.href];
  managedHistoryIndex = 0;
  managedHistoryInitialized = true;
  const normalizedState = readManagedHistoryState(currentUrl);
  writeManagedHistoryState(
    normalizedState.href === currentUrl.href ? normalizedState : normalizedState.uiSnapshotId === void 0 ? { href: currentUrl.href } : { href: currentUrl.href, uiSnapshotId: normalizedState.uiSnapshotId },
    "replace"
  );
}
function pushManagedHistoryEntry(target) {
  ensureManagedHistoryInitialized();
  managedHistoryEntries = managedHistoryEntries.slice(0, managedHistoryIndex + 1);
  managedHistoryEntries.push(target.href);
  managedHistoryIndex = managedHistoryEntries.length - 1;
  writeManagedHistoryState({ href: target.href }, "push");
}
function replaceManagedHistoryEntry(target) {
  ensureManagedHistoryInitialized();
  managedHistoryEntries[managedHistoryIndex] = target.href;
  writeManagedHistoryState({ href: target.href }, "replace");
}
function syncManagedHistoryPop(target) {
  ensureManagedHistoryInitialized();
  if (managedHistoryIndex > 0 && managedHistoryEntries[managedHistoryIndex - 1] === target.href) {
    managedHistoryIndex -= 1;
    return;
  }
  if (managedHistoryIndex + 1 < managedHistoryEntries.length && managedHistoryEntries[managedHistoryIndex + 1] === target.href) {
    managedHistoryIndex += 1;
    return;
  }
  const existingIndex = managedHistoryEntries.lastIndexOf(target.href);
  if (existingIndex >= 0) {
    managedHistoryIndex = existingIndex;
    return;
  }
  managedHistoryEntries = [target.href];
  managedHistoryIndex = 0;
}
function canManagedNavigateBack() {
  ensureManagedHistoryInitialized();
  return managedHistoryIndex > 0;
}
function canManagedNavigateForward() {
  ensureManagedHistoryInitialized();
  return managedHistoryIndex + 1 < managedHistoryEntries.length;
}
function getBrowserNavigationApi() {
  const windowWithNavigation = window;
  return windowWithNavigation.navigation ?? null;
}
function canBrowserNavigateBack() {
  const navigationApi = getBrowserNavigationApi();
  if (navigationApi?.canGoBack !== void 0) {
    return navigationApi.canGoBack;
  }
  return canManagedNavigateBack();
}
function canBrowserNavigateForward() {
  const navigationApi = getBrowserNavigationApi();
  if (navigationApi?.canGoForward !== void 0) {
    return navigationApi.canGoForward;
  }
  return canManagedNavigateForward();
}
function navigateBrowserBack() {
  if (!canBrowserNavigateBack()) {
    return;
  }
  const navigationApi = getBrowserNavigationApi();
  if (navigationApi?.back !== void 0) {
    void navigationApi.back();
    return;
  }
  window.history.back();
}
function navigateBrowserForward() {
  if (!canBrowserNavigateForward()) {
    return;
  }
  const navigationApi = getBrowserNavigationApi();
  if (navigationApi?.forward !== void 0) {
    void navigationApi.forward();
    return;
  }
  window.history.forward();
}

// node_modules/@effindomv2/runtime/src/managed-harness/persisted-ui-state.ts
var PERSISTED_UI_STATE_DB_NAME = "effindom-ui-state";
var PERSISTED_UI_STATE_DB_VERSION = 1;
var PERSISTED_UI_STATE_SNAPSHOT_SCHEMA_VERSION = 1;
var PERSISTED_UI_STATE_SNAPSHOTS_STORE = "snapshots";
var PERSISTED_UI_STATE_ROUTE_HEADS_STORE = "route-heads";
var PERSISTED_SCROLL_ENTRY_KIND = "scroll-position";
var PERSISTED_SCROLL_ENTRY_VERSION = 1;
var SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1e3;
function buildPersistedUiRouteKey(appKey, routeHref) {
  return `${appKey}
${routeHref}`;
}
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };
  });
}
function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}
function openDatabase(factory) {
  return new Promise((resolve, reject) => {
    const request = factory.open(PERSISTED_UI_STATE_DB_NAME, PERSISTED_UI_STATE_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      let snapshots = database.objectStoreNames.contains(PERSISTED_UI_STATE_SNAPSHOTS_STORE) ? request.transaction?.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE) ?? null : null;
      snapshots ??= database.createObjectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE, {
        keyPath: "snapshotId"
      });
      if (!snapshots.indexNames.contains("byLastAccessedAt")) {
        snapshots.createIndex("byLastAccessedAt", "lastAccessedAt");
      }
      let routeHeads = database.objectStoreNames.contains(PERSISTED_UI_STATE_ROUTE_HEADS_STORE) ? request.transaction?.objectStore(PERSISTED_UI_STATE_ROUTE_HEADS_STORE) ?? null : null;
      routeHeads ??= database.createObjectStore(PERSISTED_UI_STATE_ROUTE_HEADS_STORE, {
        keyPath: "routeKey"
      });
      if (!routeHeads.indexNames.contains("byUpdatedAt")) {
        routeHeads.createIndex("byUpdatedAt", "updatedAt");
      }
      if (!routeHeads.indexNames.contains("bySnapshotId")) {
        routeHeads.createIndex("bySnapshotId", "snapshotId");
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB database."));
    };
  });
}
var IndexedDbPersistedUiStateStore = class {
  databasePromise;
  constructor(factory) {
    this.databasePromise = openDatabase(factory);
  }
  async saveSnapshot(record) {
    const database = await this.databasePromise;
    const transaction = database.transaction(
      [PERSISTED_UI_STATE_SNAPSHOTS_STORE, PERSISTED_UI_STATE_ROUTE_HEADS_STORE],
      "readwrite"
    );
    const snapshots = transaction.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE);
    const routeHeads = transaction.objectStore(PERSISTED_UI_STATE_ROUTE_HEADS_STORE);
    snapshots.put(record);
    const updatedAt = Math.max(record.createdAt, record.lastAccessedAt);
    routeHeads.put({
      routeKey: buildPersistedUiRouteKey(record.appKey, record.routeHref),
      appKey: record.appKey,
      routeHref: record.routeHref,
      snapshotId: record.snapshotId,
      updatedAt
    });
    await transactionToPromise(transaction);
  }
  async loadSnapshot(snapshotId) {
    const database = await this.databasePromise;
    const loadTransaction = database.transaction(PERSISTED_UI_STATE_SNAPSHOTS_STORE, "readonly");
    const snapshots = loadTransaction.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE);
    const existing = await requestToPromise(snapshots.get(snapshotId));
    await transactionToPromise(loadTransaction);
    if (existing === void 0) {
      return null;
    }
    const updatedRecord = {
      ...existing,
      lastAccessedAt: Date.now()
    };
    const saveTransaction = database.transaction(PERSISTED_UI_STATE_SNAPSHOTS_STORE, "readwrite");
    saveTransaction.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE).put(updatedRecord);
    await transactionToPromise(saveTransaction);
    return updatedRecord;
  }
  async loadRouteHead(appKey, routeHref) {
    const database = await this.databasePromise;
    const transaction = database.transaction(PERSISTED_UI_STATE_ROUTE_HEADS_STORE, "readonly");
    const routeHeads = transaction.objectStore(PERSISTED_UI_STATE_ROUTE_HEADS_STORE);
    const routeHead = await requestToPromise(
      routeHeads.get(buildPersistedUiRouteKey(appKey, routeHref))
    );
    await transactionToPromise(transaction);
    return routeHead ?? null;
  }
  async deleteSnapshot(snapshotId) {
    const database = await this.databasePromise;
    const transaction = database.transaction(PERSISTED_UI_STATE_SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE).delete(snapshotId);
    await transactionToPromise(transaction);
  }
  async collectGarbage(now) {
    const database = await this.databasePromise;
    const transaction = database.transaction(
      [PERSISTED_UI_STATE_SNAPSHOTS_STORE, PERSISTED_UI_STATE_ROUTE_HEADS_STORE],
      "readwrite"
    );
    const snapshots = transaction.objectStore(PERSISTED_UI_STATE_SNAPSHOTS_STORE);
    const routeHeads = transaction.objectStore(PERSISTED_UI_STATE_ROUTE_HEADS_STORE);
    const snapshotRecords = await requestToPromise(snapshots.getAll());
    const routeHeadRecords = await requestToPromise(routeHeads.getAll());
    const retainedSnapshotIds = new Set(routeHeadRecords.map((record) => record.snapshotId));
    const knownSnapshotIds = new Set(snapshotRecords.map((record) => record.snapshotId));
    const pruneBefore = now - SNAPSHOT_MAX_AGE_MS;
    for (const routeHead of routeHeadRecords) {
      if (!knownSnapshotIds.has(routeHead.snapshotId)) {
        routeHeads.delete(routeHead.routeKey);
      }
    }
    for (const snapshot of snapshotRecords) {
      if (snapshot.lastAccessedAt >= pruneBefore || retainedSnapshotIds.has(snapshot.snapshotId)) {
        continue;
      }
      snapshots.delete(snapshot.snapshotId);
    }
    await transactionToPromise(transaction);
  }
};
function createPersistedUiStateStore() {
  if (typeof globalThis.indexedDB === "undefined") {
    return null;
  }
  return new IndexedDbPersistedUiStateStore(globalThis.indexedDB);
}

// node_modules/@effindomv2/runtime/src/managed-harness/persisted-restore-policy.ts
function readBrowserNavigationType(performanceLike = globalThis.performance) {
  const navigationEntry = performanceLike.getEntriesByType("navigation")[0];
  if (navigationEntry !== void 0) {
    switch (navigationEntry.type) {
      case "navigate":
      case "reload":
      case "back_forward":
      case "prerender":
        return navigationEntry.type;
      default:
        return "unknown";
    }
  }
  return "unknown";
}
function shouldRestoreInitialHistorySnapshot(navigationType, hasHistorySnapshotId) {
  if (navigationType === "back_forward") {
    return true;
  }
  if (navigationType === "navigate") {
    return hasHistorySnapshotId;
  }
  return false;
}

// node_modules/@effindomv2/runtime/src/managed-harness/persisted-ui-state-controller.ts
function createPersistedSnapshotId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}
function buildPersistedSnapshotRecord(currentUrl) {
  const timestamp = Date.now();
  return {
    snapshotId: createPersistedSnapshotId(),
    appKey: window.location.origin,
    routeHref: currentUrl.href,
    createdAt: timestamp,
    lastAccessedAt: timestamp,
    schemaVersion: PERSISTED_UI_STATE_SNAPSHOT_SCHEMA_VERSION,
    entries: []
  };
}
var PersistedUiStateController = class {
  persistedUiState = createPersistedUiStateStore();
  currentPersistedEntries = /* @__PURE__ */ new Map();
  persistedUiStateWork = Promise.resolve();
  persistedEntryKey(kind, nodeId) {
    return `${kind}
${nodeId}`;
  }
  reportPersistedUiStateError(context, error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[fui_persist] ${context}: ${message}`);
  }
  collectGarbage(context) {
    if (this.persistedUiState === null) {
      return;
    }
    void this.persistedUiState.collectGarbage(Date.now()).catch((error) => {
      this.reportPersistedUiStateError(`collecting garbage after ${context}`, error);
    });
  }
  async saveSnapshotForUrl(url, context, capture) {
    if (this.persistedUiState === null) {
      return null;
    }
    this.captureCurrentPersistedUiState(context, capture);
    const record = {
      ...buildPersistedSnapshotRecord(url),
      entries: Array.from(this.currentPersistedEntries.values())
    };
    try {
      await this.persistedUiState.saveSnapshot(record);
    } catch (error) {
      this.reportPersistedUiStateError(`saving snapshot while ${context}`, error);
      return null;
    }
    this.collectGarbage(context);
    return record;
  }
  clearCurrentPersistedEntries() {
    this.currentPersistedEntries.clear();
  }
  hydrateCurrentPersistedEntries(snapshot) {
    this.clearCurrentPersistedEntries();
    if (snapshot === null) {
      return;
    }
    for (const entry of snapshot.entries) {
      this.currentPersistedEntries.set(this.persistedEntryKey(entry.kind, entry.nodeId), entry);
    }
  }
  setCurrentPersistedEntry(entry) {
    this.currentPersistedEntries.set(this.persistedEntryKey(entry.kind, entry.nodeId), entry);
  }
  setCurrentPersistedScrollEntry(nodeId, x, y) {
    this.setCurrentPersistedEntry({
      nodeId,
      kind: PERSISTED_SCROLL_ENTRY_KIND,
      version: PERSISTED_SCROLL_ENTRY_VERSION,
      payload: { x, y }
    });
  }
  setCurrentPersistedTextEntry(nodeId, kind, version, payload) {
    this.setCurrentPersistedEntry({
      nodeId,
      kind,
      version,
      payload
    });
  }
  getCurrentPersistedScrollEntry(nodeId) {
    const entry = this.currentPersistedEntries.get(this.persistedEntryKey(PERSISTED_SCROLL_ENTRY_KIND, nodeId));
    if (entry?.kind !== PERSISTED_SCROLL_ENTRY_KIND) {
      return null;
    }
    const payload = entry.payload;
    if (payload === null || typeof payload !== "object") {
      return null;
    }
    if (typeof payload.x !== "number" || typeof payload.y !== "number") {
      return null;
    }
    return {
      x: payload.x,
      y: payload.y
    };
  }
  getCurrentPersistedTextEntry(nodeId, kind) {
    const entry = this.currentPersistedEntries.get(this.persistedEntryKey(kind, nodeId));
    if (entry?.kind !== kind || typeof entry.payload !== "string") {
      return null;
    }
    return {
      version: entry.version,
      payload: entry.payload
    };
  }
  captureCurrentPersistedUiState(context, capture) {
    this.clearCurrentPersistedEntries();
    if (capture === void 0) {
      return;
    }
    try {
      capture();
    } catch (error) {
      this.clearCurrentPersistedEntries();
      this.reportPersistedUiStateError(`capturing persisted state while ${context}`, error);
    }
  }
  restoreCurrentPersistedUiState(context, restore) {
    if (restore === void 0) {
      return;
    }
    try {
      restore();
    } catch (error) {
      this.reportPersistedUiStateError(`restoring persisted state while ${context}`, error);
    }
  }
  queuePersistedUiStateWork(work) {
    const next = this.persistedUiStateWork.then(work, work);
    this.persistedUiStateWork = next.then(
      () => void 0,
      () => void 0
    );
    return next;
  }
  async loadPersistedSnapshotById(snapshotId, context) {
    if (this.persistedUiState === null) {
      return null;
    }
    try {
      const snapshot = await this.persistedUiState.loadSnapshot(snapshotId);
      if (snapshot === null) {
        console.error(`[fui_persist] Missing snapshot ${snapshotId} while ${context}.`);
      }
      return snapshot;
    } catch (error) {
      this.reportPersistedUiStateError(`loading snapshot while ${context}`, error);
      return null;
    }
  }
  async loadCurrentHistoryEntrySnapshot(context) {
    const state = readManagedHistoryState();
    if (state.uiSnapshotId === void 0) {
      return null;
    }
    return this.loadPersistedSnapshotById(state.uiSnapshotId, context);
  }
  async loadRouteHeadSnapshot(routeHref, context) {
    if (this.persistedUiState === null) {
      return null;
    }
    try {
      const routeHead = await this.persistedUiState.loadRouteHead(window.location.origin, routeHref);
      if (routeHead === null) {
        return null;
      }
      return await this.loadPersistedSnapshotById(routeHead.snapshotId, `${context} via route head`);
    } catch (error) {
      this.reportPersistedUiStateError(`loading route head while ${context}`, error);
      return null;
    }
  }
  async loadSelectedPersistedSnapshot(context, routeHref = window.location.href) {
    const fromHistory = await this.loadCurrentHistoryEntrySnapshot(context);
    if (fromHistory !== null) {
      return fromHistory;
    }
    return this.loadRouteHeadSnapshot(routeHref, context);
  }
  async loadPopPersistedSnapshot(context, routeHref = window.location.href) {
    const [fromHistory, fromRouteHead] = await Promise.all([
      this.loadCurrentHistoryEntrySnapshot(context),
      this.loadRouteHeadSnapshot(routeHref, context)
    ]);
    if (fromHistory === null) {
      return fromRouteHead;
    }
    if (fromRouteHead === null) {
      return fromHistory;
    }
    return fromRouteHead.createdAt > fromHistory.createdAt ? fromRouteHead : fromHistory;
  }
  async loadInitialPersistedSnapshot(context) {
    const state = readManagedHistoryState();
    const navigationType = readBrowserNavigationType();
    const shouldRestore = shouldRestoreInitialHistorySnapshot(
      navigationType,
      state.uiSnapshotId !== void 0
    );
    if (!shouldRestore) {
      if (state.uiSnapshotId !== void 0) {
        setCurrentManagedHistorySnapshotId(void 0);
      }
      return null;
    }
    const fromHistory = await this.loadCurrentHistoryEntrySnapshot(`${context} via ${navigationType}`);
    if (fromHistory !== null) {
      return fromHistory;
    }
    return navigationType === "back_forward" ? this.loadRouteHeadSnapshot(window.location.href, `${context} via ${navigationType}`) : null;
  }
  async saveCurrentHistoryEntrySnapshot(context, capture) {
    const currentUrl = new URL(window.location.href);
    const record = await this.saveSnapshotForUrl(currentUrl, context, capture);
    if (record === null) {
      return null;
    }
    setCurrentManagedHistorySnapshotId(record.snapshotId, currentUrl);
    return record.snapshotId;
  }
  async saveRouteHeadSnapshotForHref(routeHref, context, capture) {
    const record = await this.saveSnapshotForUrl(new URL(routeHref), context, capture);
    return record?.snapshotId ?? null;
  }
  async ensureCurrentHistoryEntrySnapshot(context, capture) {
    const state = readManagedHistoryState();
    if (state.uiSnapshotId === void 0) {
      return this.saveCurrentHistoryEntrySnapshot(context, capture);
    }
    const loaded = await this.loadCurrentHistoryEntrySnapshot(context);
    if (loaded !== null) {
      return state.uiSnapshotId;
    }
    return this.saveCurrentHistoryEntrySnapshot(context, capture);
  }
};

// node_modules/@effindomv2/runtime/src/managed-harness/text-session-bridge.ts
var decoder = new TextDecoder();
var encoder4 = new TextEncoder();
var TEXTBOX_HARD_CLAMP_MAX_CODEPOINTS = 1e4;
function advanceCodeUnitIndex(text, index) {
  const codePoint = text.codePointAt(index) ?? 0;
  return index + (codePoint > 65535 ? 2 : 1);
}
function isLineBreakCodeUnit(text, index) {
  if (index < 0 || index >= text.length) {
    return false;
  }
  const codeUnit = text.charCodeAt(index);
  return codeUnit === 10 || codeUnit === 13;
}
function collectTextboxHardLineClampRanges(text) {
  const ranges = [];
  let index = 0;
  while (index < text.length) {
    let lineCapEnd = index;
    let lineEnd = index;
    let codePointCount = 0;
    while (lineEnd < text.length && !isLineBreakCodeUnit(text, lineEnd)) {
      const next = advanceCodeUnitIndex(text, lineEnd);
      if (codePointCount < TEXTBOX_HARD_CLAMP_MAX_CODEPOINTS) {
        lineCapEnd = next;
      }
      codePointCount += 1;
      lineEnd = next;
    }
    if (codePointCount > TEXTBOX_HARD_CLAMP_MAX_CODEPOINTS) {
      ranges.push({ start: lineCapEnd, end: lineEnd });
    }
    if (lineEnd >= text.length) {
      break;
    }
    if (text.charCodeAt(lineEnd) === 13 && lineEnd + 1 < text.length && text.charCodeAt(lineEnd + 1) === 10) {
      index = lineEnd + 2;
    } else {
      index = lineEnd + 1;
    }
  }
  return ranges;
}
function mapClampedTextIndex(index, ranges) {
  const clampedIndex = Math.max(0, index);
  let removedBefore = 0;
  for (const range of ranges) {
    if (clampedIndex <= range.start) {
      break;
    }
    if (clampedIndex < range.end) {
      return range.start - removedBefore;
    }
    removedBefore += range.end - range.start;
  }
  return clampedIndex - removedBefore;
}
function clampTextboxHardLines(text) {
  const ranges = collectTextboxHardLineClampRanges(text);
  if (ranges.length === 0) {
    return {
      text,
      mapIndex: (index) => Math.max(0, Math.min(index, text.length))
    };
  }
  let result = "";
  let cursor = 0;
  for (const range of ranges) {
    result += text.slice(cursor, range.start);
    cursor = range.end;
  }
  result += text.slice(cursor);
  return {
    text: result,
    mapIndex: (index) => mapClampedTextIndex(index, ranges)
  };
}
function computeReplacementEdit(previousText, nextText) {
  if (previousText === nextText) {
    return null;
  }
  const sharedPrefixLimit = Math.min(previousText.length, nextText.length);
  let prefix = 0;
  while (prefix < sharedPrefixLimit && previousText.charCodeAt(prefix) === nextText.charCodeAt(prefix)) {
    prefix += 1;
  }
  let suffix = 0;
  while (suffix < previousText.length - prefix && suffix < nextText.length - prefix && previousText.charCodeAt(previousText.length - suffix - 1) === nextText.charCodeAt(nextText.length - suffix - 1)) {
    suffix += 1;
  }
  return {
    start: prefix,
    end: previousText.length - suffix,
    insertedText: nextText.slice(prefix, nextText.length - suffix)
  };
}
function applyReplacementEdit(text, start, end, insertedText) {
  const clampedStart = Math.max(0, Math.min(start, text.length));
  const clampedEnd = Math.max(clampedStart, Math.min(end, text.length));
  return `${text.slice(0, clampedStart)}${insertedText}${text.slice(clampedEnd)}`;
}
function getHiddenTextEditor() {
  const activeElement = document.activeElement;
  if ((activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) && activeElement.dataset.effindomHiddenEditor === "true") {
    return activeElement;
  }
  const editor = document.querySelector('input[data-effindom-hidden-editor="true"], textarea[data-effindom-hidden-editor="true"]');
  return editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement ? editor : null;
}
var TextSessionBridge = class {
  constructor(getRuntime, getCurrentMemory, queueHarnessFrame) {
    this.getRuntime = getRuntime;
    this.getCurrentMemory = getCurrentMemory;
    this.queueHarnessFrame = queueHarnessFrame;
  }
  getRuntime;
  getCurrentMemory;
  queueHarnessFrame;
  latestTextByHandle = /* @__PURE__ */ new Map();
  latestSelectionByHandle = /* @__PURE__ */ new Map();
  frozenTextSelectionSnapshot = null;
  clearState() {
    this.latestTextByHandle.clear();
    this.latestSelectionByHandle.clear();
    this.frozenTextSelectionSnapshot = null;
  }
  readAppUtf8(ptr, len) {
    if (len === 0) {
      return "";
    }
    return decoder.decode(new Uint8Array(this.getCurrentMemory().buffer, ptr, len));
  }
  readAppFloats(ptr, count) {
    if (count === 0) {
      return new Float32Array(0);
    }
    return new Float32Array(this.getCurrentMemory().buffer.slice(ptr, ptr + count * 4));
  }
  readAppBytes(ptr, len) {
    if (len === 0) {
      return new Uint8Array(0);
    }
    return new Uint8Array(this.getCurrentMemory().buffer.slice(ptr, ptr + len));
  }
  readAppTextParts(ptr, len) {
    if (len === 0) {
      return [];
    }
    const source = new Uint8Array(this.getCurrentMemory().buffer, ptr, len);
    if (source.byteLength < 4) {
      throw new Error("Fetch request header payload was truncated.");
    }
    const dataView = new DataView(source.buffer, source.byteOffset, source.byteLength);
    let byteOffset = 0;
    const count = dataView.getUint32(byteOffset, true);
    byteOffset += 4;
    const values = [];
    for (let index = 0; index < count; index += 1) {
      if (byteOffset + 4 > source.byteLength) {
        throw new Error("Fetch request header length was truncated.");
      }
      const partLen = dataView.getUint32(byteOffset, true);
      byteOffset += 4;
      if (byteOffset + partLen > source.byteLength) {
        throw new Error("Fetch request header value was truncated.");
      }
      values.push(partLen > 0 ? decoder.decode(source.subarray(byteOffset, byteOffset + partLen)) : "");
      byteOffset += partLen;
    }
    return values;
  }
  writeAppFloat32(ptr, value) {
    const appView = new DataView(this.getCurrentMemory().buffer);
    appView.setFloat32(ptr, value, true);
  }
  writeAppUint32(ptr, value) {
    const appView = new DataView(this.getCurrentMemory().buffer);
    appView.setUint32(ptr, value >>> 0, true);
  }
  writeAppUtf8(ptr, capacity, text, context) {
    if (capacity <= 0) {
      if (text.length === 0) {
        return 0;
      }
      throw new Error(`${context} cannot write into a zero-length host-service buffer.`);
    }
    const encoded = encoder4.encode(text);
    if (encoded.length > capacity) {
      throw new Error(`${context} exceeds the provided host-service buffer.`);
    }
    if (encoded.length > 0) {
      const memory = new Uint8Array(this.getCurrentMemory().buffer, ptr, encoded.length);
      memory.set(encoded);
    }
    return encoded.length;
  }
  writeTextCallbackPayload(session, text, context) {
    const encoded = encoder4.encode(text);
    if (encoded.length > session.textBufferSize) {
      throw new Error(`${context} exceeds the shared AssemblyScript text buffer.`);
    }
    if (encoded.length > 0) {
      const memory = new Uint8Array(this.getCurrentMemory().buffer, session.textBufferPtr, encoded.length);
      memory.set(encoded);
    }
    return encoded.length;
  }
  writeWorkerTextCallbackPayload(session, text, context) {
    return this.writeTextCallbackPayload(session, text, context);
  }
  writeTextToSessionBuffer(session, text) {
    if (session.textBufferPtr === 0 || session.textBufferSize === 0) {
      return 0;
    }
    const encoded = encoder4.encode(text);
    const length = Math.min(encoded.length, session.textBufferSize);
    if (length > 0) {
      const memory = new Uint8Array(this.getCurrentMemory().buffer, session.textBufferPtr, length);
      memory.set(encoded.subarray(0, length));
    }
    return length;
  }
  withUiUtf8(text, callback) {
    const runtime = this.getRuntime();
    if (text.length === 0) {
      callback(zeroPointer(runtime), 0);
      return;
    }
    const bytes = encoder4.encode(text);
    withHeapBytes(runtime.ui, bytes, (heap) => {
      callback(heap.ptr, heap.len);
    });
  }
  withUiGridData(values, types, callback) {
    const runtime = this.getRuntime();
    const valueBytes = new Uint8Array(values.buffer);
    withHeapBytes(runtime.ui, valueBytes, (valueHeap) => {
      withHeapBytes(runtime.ui, types, (typeHeap) => {
        callback(valueHeap.ptr, typeHeap.ptr);
      });
    });
  }
  withUiGradientData(offsets, colors, callback) {
    const runtime = this.getRuntime();
    const offsetBytes = new Uint8Array(offsets.buffer);
    const colorBytes = new Uint8Array(colors.buffer);
    withHeapBytes(runtime.ui, offsetBytes, (offsetHeap) => {
      withHeapBytes(runtime.ui, colorBytes, (colorHeap) => {
        callback(offsetHeap.ptr, colorHeap.ptr);
      });
    });
  }
  recordTextChanged(handle, text) {
    this.latestTextByHandle.set(toBigIntHandle(handle).toString(), text);
  }
  recordTextReplaced(handle, start, end, text) {
    const handleKey = toBigIntHandle(handle).toString();
    const previousText = this.latestTextByHandle.get(handleKey) ?? "";
    this.latestTextByHandle.set(handleKey, applyReplacementEdit(previousText, start, end, text));
  }
  recordSelectionChanged(handle, start, end) {
    this.latestSelectionByHandle.set(toBigIntHandle(handle).toString(), { start, end });
  }
  getLatestText(handle) {
    return this.latestTextByHandle.get(toBigIntHandle(handle).toString()) ?? "";
  }
  resolveFrozenOrLiveTextSelection(handle) {
    const handleKey = toBigIntHandle(handle).toString();
    if (this.frozenTextSelectionSnapshot !== null && this.frozenTextSelectionSnapshot.handleKey === handleKey && this.frozenTextSelectionSnapshot.start !== this.frozenTextSelectionSnapshot.end) {
      return this.frozenTextSelectionSnapshot;
    }
    const text = this.latestTextByHandle.get(handleKey) ?? "";
    const selection = this.latestSelectionByHandle.get(handleKey) ?? null;
    if (selection === null || selection.start === selection.end || text.length === 0) {
      return null;
    }
    const start = Math.max(0, Math.min(selection.start, selection.end));
    const end = Math.max(start, Math.min(text.length, Math.max(selection.start, selection.end)));
    return { handleKey, text, start, end };
  }
  freezeTextSelectionSnapshot(handle) {
    this.frozenTextSelectionSnapshot = this.resolveFrozenOrLiveTextSelection(handle);
  }
  clearFrozenTextSelectionSnapshot() {
    this.frozenTextSelectionSnapshot = null;
  }
  getHiddenTextEditor() {
    return getHiddenTextEditor();
  }
  syncEditableTextToRuntime(handle, text, caret) {
    const runtime = this.getRuntime();
    const handleKey = toBigIntHandle(handle).toString();
    const previousText = this.latestTextByHandle.get(handleKey) ?? "";
    const replacement = computeReplacementEdit(previousText, text);
    if (replacement === null) {
      runtime.commitFrame();
      this.queueHarnessFrame();
      return;
    }
    const intendedText = `${previousText.slice(0, replacement.start)}${replacement.insertedText}${previousText.slice(replacement.end)}`;
    const intendedCaret = Math.max(0, Math.min(caret, intendedText.length));
    const clamped = clampTextboxHardLines(intendedText);
    const committedText = clamped.text;
    const clampedCaret = clamped.mapIndex(intendedCaret);
    const editor = getHiddenTextEditor();
    if (editor !== null && editor.value !== committedText) {
      editor.value = committedText;
      editor.setSelectionRange(clampedCaret, clampedCaret, "none");
    }
    const committedReplacement = computeReplacementEdit(previousText, committedText);
    if (committedReplacement === null) {
      runtime.commitFrame();
      this.queueHarnessFrame();
      return;
    }
    runtime.ui._ui_set_interaction_time(currentInteractionTimeMs());
    this.withUiUtf8(committedReplacement.insertedText, (uiPtr, uiLen) => {
      runtime.ui._ui_replace_text_range(
        toBigIntHandle(handle),
        committedReplacement.start,
        committedReplacement.end,
        uiPtr,
        uiLen,
        clampedCaret
      );
    });
    runtime.commitFrame();
    this.queueHarnessFrame();
  }
  updateLiveTextAfterCut(handleKey, text, caret) {
    this.latestTextByHandle.set(handleKey, text);
    this.latestSelectionByHandle.set(handleKey, { start: caret, end: caret });
  }
};

// node_modules/@effindomv2/runtime/src/managed-harness/ui-chrome.ts
var DEFAULT_ACCENT_COLOR = 627305471;
var URL_PREVIEW_BAR_ID = "fui-url-bar";
var PLATFORM_FAMILY_UNKNOWN = 0;
var PLATFORM_FAMILY_APPLE = 1;
var PLATFORM_FAMILY_WINDOWS = 2;
var PLATFORM_FAMILY_LINUX = 3;
var LOADING_OVERLAY_ID = "effindom-loading-overlay";
var LOADING_TITLE_ID = "effindom-loading-title";
var LOADING_DETAIL_ID = "effindom-loading-detail";
function packColor(red, green, blue, alpha = 255) {
  return ((red & 255) << 24 | (green & 255) << 16 | (blue & 255) << 8 | alpha & 255) >>> 0;
}
function parseCssColorToRgba(colorValue) {
  const probe = document.createElement("span");
  probe.style.color = colorValue;
  if (probe.style.color.length === 0) {
    return null;
  }
  probe.style.position = "absolute";
  probe.style.pointerEvents = "none";
  probe.style.opacity = "0";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color.trim();
  probe.remove();
  const match = /^rgba?\(([^)]+)\)$/.exec(computed);
  if (match === null) {
    return null;
  }
  const channels = match[1];
  if (channels === void 0) {
    return null;
  }
  const parts = channels.split(",").map((part) => part.trim());
  if (parts.length < 3) {
    return null;
  }
  const [redPart, greenPart, bluePart, alphaPart] = parts;
  if (redPart === void 0 || greenPart === void 0 || bluePart === void 0) {
    return null;
  }
  const red = Number.parseInt(redPart, 10);
  const green = Number.parseInt(greenPart, 10);
  const blue = Number.parseInt(bluePart, 10);
  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null;
  }
  const alpha = parts.length < 4 ? 255 : Math.max(0, Math.min(255, Math.round(Number.parseFloat(alphaPart ?? "1") * 255)));
  return packColor(red, green, blue, alpha);
}
function readCssSystemAccentColor() {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function" || !CSS.supports("color", "AccentColor")) {
    return null;
  }
  return parseCssColorToRgba("AccentColor");
}
function readCssRootAccentColor() {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("accent-color").trim();
  if (accent.length === 0 || accent === "auto") {
    return null;
  }
  return parseCssColorToRgba(accent);
}
function readWebkitFocusRingAccentColor() {
  return parseCssColorToRgba("-webkit-focus-ring-color");
}
function readHostAccentColor() {
  return readCssSystemAccentColor() ?? readWebkitFocusRingAccentColor() ?? readCssRootAccentColor() ?? DEFAULT_ACCENT_COLOR;
}
function ensureUrlPreviewBar() {
  const existing = document.getElementById(URL_PREVIEW_BAR_ID);
  if (existing instanceof HTMLDivElement) {
    return existing;
  }
  const bar = document.createElement("div");
  bar.id = URL_PREVIEW_BAR_ID;
  bar.hidden = true;
  bar.dataset.visible = "false";
  bar.setAttribute("aria-hidden", "true");
  bar.style.position = "fixed";
  bar.style.left = "12px";
  bar.style.bottom = "12px";
  bar.style.maxWidth = "min(60vw, 720px)";
  bar.style.padding = "6px 10px";
  bar.style.borderRadius = "10px";
  bar.style.background = "rgba(15, 23, 42, 0.84)";
  bar.style.color = "#f8fafc";
  bar.style.font = '12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  bar.style.letterSpacing = "0.01em";
  bar.style.whiteSpace = "nowrap";
  bar.style.overflow = "hidden";
  bar.style.textOverflow = "ellipsis";
  bar.style.pointerEvents = "none";
  bar.style.opacity = "0";
  bar.style.transform = "translateY(6px)";
  bar.style.transition = "opacity 120ms ease, transform 120ms ease";
  bar.style.backdropFilter = "blur(12px)";
  bar.style.boxShadow = "0 10px 28px rgba(2, 6, 23, 0.24)";
  bar.style.zIndex = "2147483647";
  document.body.appendChild(bar);
  return bar;
}
function waitForFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
var HarnessUiChrome = class {
  getLoadingOverlayText() {
    const overlay = document.getElementById(LOADING_OVERLAY_ID);
    const titleNode = document.getElementById(LOADING_TITLE_ID);
    const detailNode = document.getElementById(LOADING_DETAIL_ID);
    const title = titleNode instanceof HTMLElement ? titleNode.textContent : "";
    const detail = detailNode instanceof HTMLElement ? detailNode.textContent : "";
    if (overlay instanceof HTMLElement && title.length > 0 && detail.length > 0) {
      return { title, detail };
    }
    return {
      title: "Loading...",
      detail: "The runtime is starting up."
    };
  }
  setLoadingOverlay(state, title, detail) {
    const overlay = document.getElementById(LOADING_OVERLAY_ID);
    const titleNode = document.getElementById(LOADING_TITLE_ID);
    const detailNode = document.getElementById(LOADING_DETAIL_ID);
    if (!(overlay instanceof HTMLElement) || !(titleNode instanceof HTMLElement) || !(detailNode instanceof HTMLElement)) {
      return;
    }
    overlay.dataset.state = state;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    titleNode.textContent = title;
    detailNode.textContent = detail;
  }
  hideLoadingOverlay() {
    const overlay = document.getElementById(LOADING_OVERLAY_ID);
    if (!(overlay instanceof HTMLElement)) {
      return;
    }
    overlay.hidden = true;
    overlay.dataset.state = "ready";
    overlay.setAttribute("aria-hidden", "true");
  }
  setUrlPreviewText(text) {
    const bar = ensureUrlPreviewBar();
    if (text.length === 0) {
      bar.textContent = "";
      bar.hidden = true;
      bar.dataset.visible = "false";
      bar.style.opacity = "0";
      bar.style.transform = "translateY(6px)";
      window.__fuiUrlPreviewText = "";
      return;
    }
    bar.textContent = text;
    bar.hidden = false;
    bar.dataset.visible = "true";
    bar.style.opacity = "1";
    bar.style.transform = "translateY(0)";
    window.__fuiUrlPreviewText = text;
  }
  readHostAccentColor() {
    return readHostAccentColor();
  }
  detectPlatformFamily() {
    const navigatorWithUserAgentData = navigator;
    const platform = (navigatorWithUserAgentData.userAgentData?.platform ?? navigator.userAgent).toLowerCase();
    if (platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad") || platform.includes("ipod") || platform.includes("ios")) {
      return PLATFORM_FAMILY_APPLE;
    }
    if (platform.includes("win")) {
      return PLATFORM_FAMILY_WINDOWS;
    }
    if (platform.includes("linux") || platform.includes("android") || platform.includes("x11") || platform.includes("cros")) {
      return PLATFORM_FAMILY_LINUX;
    }
    return PLATFORM_FAMILY_UNKNOWN;
  }
  detectCoarsePointer() {
    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  }
  getCanvasSizeSource(canvas) {
    const source = canvas.closest("[data-effindom-canvas-size-source]");
    return source instanceof HTMLElement ? source : canvas;
  }
};

// node_modules/@effindomv2/runtime/src/managed-harness/ui-imports.ts
function createUiImportModule(deps) {
  return {
    ui_reset() {
      const runtime = deps.getRuntime();
      runtime.ui._ui_reset();
      deps.syncUiHostCapabilities();
      deps.resetUiState();
    },
    ui_create_node(type) {
      return toBigIntHandle(deps.getRuntime().ui._ui_create_node(type));
    },
    ui_set_node_id(handle, ptr, len) {
      const runtime = deps.getRuntime();
      const text = deps.readAppUtf8(ptr, len);
      deps.withUiUtf8(text, (uiPtr, uiLen) => {
        runtime.ui._ui_set_node_id(toBigIntHandle(handle), uiPtr, uiLen);
      });
    },
    ui_delete_node(handle) {
      deps.getRuntime().ui._ui_delete_node(toBigIntHandle(handle));
    },
    ui_set_semantic_role(handle, role) {
      deps.getRuntime().ui._ui_set_semantic_role(toBigIntHandle(handle), role);
    },
    ui_set_semantic_label(handle, ptr, len) {
      const runtime = deps.getRuntime();
      const text = deps.readAppUtf8(ptr, len);
      deps.withUiUtf8(text, (uiPtr, uiLen) => {
        runtime.ui._ui_set_semantic_label(toBigIntHandle(handle), uiPtr, uiLen);
      });
    },
    ui_set_semantic_checked(handle, checkedState) {
      deps.getRuntime().ui._ui_set_semantic_checked(toBigIntHandle(handle), checkedState);
    },
    ui_set_semantic_selected(handle, hasSelected, selected) {
      deps.getRuntime().ui._ui_set_semantic_selected(toBigIntHandle(handle), hasSelected, selected);
    },
    ui_set_semantic_expanded(handle, hasExpanded, expanded) {
      deps.getRuntime().ui._ui_set_semantic_expanded(toBigIntHandle(handle), hasExpanded, expanded);
    },
    ui_set_semantic_disabled(handle, hasDisabled, disabled) {
      deps.getRuntime().ui._ui_set_semantic_disabled(toBigIntHandle(handle), hasDisabled, disabled);
    },
    ui_set_semantic_value_range(handle, hasValueRange, valueNow, valueMin, valueMax) {
      deps.getRuntime().ui._ui_set_semantic_value_range(toBigIntHandle(handle), hasValueRange, valueNow, valueMin, valueMax);
    },
    ui_set_semantic_orientation(handle, orientation) {
      deps.getRuntime().ui._ui_set_semantic_orientation(toBigIntHandle(handle), orientation);
    },
    ui_request_semantic_announcement(handle) {
      deps.getRuntime().ui._ui_request_semantic_announcement(toBigIntHandle(handle));
    },
    ui_push_semantic_scope(handle) {
      return deps.getRuntime().ui._ui_push_semantic_scope(toBigIntHandle(handle));
    },
    ui_remove_semantic_scope(token) {
      deps.getRuntime().ui._ui_remove_semantic_scope(token);
    },
    ui_node_add_child(parent, child) {
      deps.getRuntime().ui._ui_node_add_child(toBigIntHandle(parent), toBigIntHandle(child));
    },
    ui_node_remove_child(parent, child) {
      deps.getRuntime().ui._ui_node_remove_child(toBigIntHandle(parent), toBigIntHandle(child));
    },
    ui_set_is_portal(handle, flag) {
      deps.getRuntime().ui._ui_set_is_portal(toBigIntHandle(handle), flag);
    },
    ui_set_is_shared_size_scope(handle, flag) {
      deps.getRuntime().ui._ui_set_is_shared_size_scope(toBigIntHandle(handle), flag);
    },
    ui_set_custom_drawable(handle, flag) {
      deps.getRuntime().ui._ui_set_custom_drawable(toBigIntHandle(handle), flag);
    },
    ui_set_flex_wrap(handle, wrap) {
      deps.getRuntime().ui._ui_set_flex_wrap(toBigIntHandle(handle), wrap);
    },
    ui_prepare_node(handle) {
      const resolved = deps.getRuntime().ui._ui_prepare_node(toBigIntHandle(handle));
      return resolved;
    },
    ui_set_dynamic_text_charset(handle, ptr, len) {
      const runtime = deps.getRuntime();
      const value = len > 0 ? deps.readAppUtf8(ptr, len) : "";
      deps.withUiUtf8(value, (uiPtr, uiLen) => {
        runtime.ui._ui_set_dynamic_text_charset(toBigIntHandle(handle), uiPtr, uiLen);
      });
    },
    ui_set_root(handle) {
      const runtime = deps.getRuntime();
      const rootHandle = toBigIntHandle(handle);
      deps.setLatestRootHandle(rootHandle.toString());
      runtime.ui._ui_set_root(rootHandle);
      deps.updateState();
    },
    ui_set_width(handle, value, unit) {
      deps.getRuntime().ui._ui_set_width(toBigIntHandle(handle), value, unit);
    },
    ui_set_height(handle, value, unit) {
      deps.getRuntime().ui._ui_set_height(toBigIntHandle(handle), value, unit);
    },
    ui_set_fill_width(handle, fill) {
      deps.getRuntime().ui._ui_set_fill_width(toBigIntHandle(handle), fill);
    },
    ui_set_fill_height(handle, fill) {
      deps.getRuntime().ui._ui_set_fill_height(toBigIntHandle(handle), fill);
    },
    ui_set_fill_width_percent(handle, percent) {
      deps.getRuntime().ui._ui_set_fill_width_percent(toBigIntHandle(handle), percent);
    },
    ui_set_fill_height_percent(handle, percent) {
      deps.getRuntime().ui._ui_set_fill_height_percent(toBigIntHandle(handle), percent);
    },
    ui_set_min_width(handle, value, unit) {
      deps.getRuntime().ui._ui_set_min_width(toBigIntHandle(handle), value, unit);
    },
    ui_set_max_width(handle, value, unit) {
      deps.getRuntime().ui._ui_set_max_width(toBigIntHandle(handle), value, unit);
    },
    ui_set_min_height(handle, value, unit) {
      deps.getRuntime().ui._ui_set_min_height(toBigIntHandle(handle), value, unit);
    },
    ui_set_max_height(handle, value, unit) {
      deps.getRuntime().ui._ui_set_max_height(toBigIntHandle(handle), value, unit);
    },
    ui_set_flex_direction(handle, direction) {
      deps.getRuntime().ui._ui_set_flex_direction(toBigIntHandle(handle), direction);
    },
    ui_set_flex_basis(handle, basis) {
      deps.getRuntime().ui._ui_set_flex_basis(toBigIntHandle(handle), basis);
    },
    ui_set_justify_content(handle, justify) {
      deps.getRuntime().ui._ui_set_justify_content(toBigIntHandle(handle), justify);
    },
    ui_set_align_items(handle, align) {
      deps.getRuntime().ui._ui_set_align_items(toBigIntHandle(handle), align);
    },
    ui_set_align_self(handle, align) {
      deps.getRuntime().ui._ui_set_align_self(toBigIntHandle(handle), align);
    },
    ui_set_padding(handle, left, top, right, bottom) {
      deps.getRuntime().ui._ui_set_padding(toBigIntHandle(handle), left, top, right, bottom);
    },
    ui_set_margin(handle, left, top, right, bottom) {
      deps.getRuntime().ui._ui_set_margin(toBigIntHandle(handle), left, top, right, bottom);
    },
    ui_set_position_type(handle, positionType) {
      deps.getRuntime().ui._ui_set_position_type(toBigIntHandle(handle), positionType);
    },
    ui_set_position(handle, left, top, right, bottom) {
      deps.getRuntime().ui._ui_set_position(toBigIntHandle(handle), left, top, right, bottom);
    },
    ui_grid_set_columns(handle, count, valuesPtr, typesPtr) {
      const runtime = deps.getRuntime();
      deps.withUiGridData(deps.readAppFloats(valuesPtr, count), deps.readAppBytes(typesPtr, count), (uiValuesPtr, uiTypesPtr) => {
        runtime.ui._ui_grid_set_columns(toBigIntHandle(handle), count, uiValuesPtr, uiTypesPtr);
      });
    },
    ui_grid_set_rows(handle, count, valuesPtr, typesPtr) {
      const runtime = deps.getRuntime();
      deps.withUiGridData(deps.readAppFloats(valuesPtr, count), deps.readAppBytes(typesPtr, count), (uiValuesPtr, uiTypesPtr) => {
        runtime.ui._ui_grid_set_rows(toBigIntHandle(handle), count, uiValuesPtr, uiTypesPtr);
      });
    },
    ui_grid_set_column_shared_size_group(handle, index, ptr, len) {
      const runtime = deps.getRuntime();
      const text = deps.readAppUtf8(ptr, len);
      deps.withUiUtf8(text, (uiPtr, uiLen) => {
        runtime.ui._ui_grid_set_column_shared_size_group(toBigIntHandle(handle), index, uiPtr, uiLen);
      });
    },
    ui_grid_set_row_shared_size_group(handle, index, ptr, len) {
      const runtime = deps.getRuntime();
      const text = deps.readAppUtf8(ptr, len);
      deps.withUiUtf8(text, (uiPtr, uiLen) => {
        runtime.ui._ui_grid_set_row_shared_size_group(toBigIntHandle(handle), index, uiPtr, uiLen);
      });
    },
    ui_node_set_grid_placement(handle, row, col, rowSpan, colSpan) {
      deps.getRuntime().ui._ui_node_set_grid_placement(toBigIntHandle(handle), row, col, rowSpan, colSpan);
    },
    ui_set_bg_color(handle, color) {
      deps.getRuntime().ui._ui_set_bg_color(toBigIntHandle(handle), color);
    },
    ui_set_box_style(handle, bgColor, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius, borderWidth, borderColor, borderStyle, borderDashOn, borderDashOff) {
      deps.getRuntime().ui._ui_set_box_style(
        toBigIntHandle(handle),
        bgColor,
        topLeftRadius,
        topRightRadius,
        bottomRightRadius,
        bottomLeftRadius,
        borderWidth,
        borderColor,
        borderStyle,
        borderDashOn,
        borderDashOff
      );
    },
    ui_set_layer_effect(handle, opacity, blurSigma, blendMode) {
      deps.getRuntime().ui._ui_set_layer_effect(toBigIntHandle(handle), opacity, blurSigma, blendMode);
    },
    ui_set_drop_shadow(handle, color, offsetX, offsetY, blurSigma, spread) {
      deps.getRuntime().ui._ui_set_drop_shadow(toBigIntHandle(handle), color, offsetX, offsetY, blurSigma, spread);
    },
    ui_set_background_blur(handle, blurSigma) {
      deps.getRuntime().ui._ui_set_background_blur(toBigIntHandle(handle), blurSigma);
    },
    ui_set_image(handle, textureId, objectFit, samplingKind, maxAniso) {
      deps.getRuntime().ui._ui_set_image(toBigIntHandle(handle), textureId, objectFit, samplingKind, maxAniso);
    },
    ui_set_image_nine(handle, textureId, insetLeft, insetTop, insetRight, insetBottom, samplingKind, maxAniso) {
      deps.getRuntime().ui._ui_set_image_nine(
        toBigIntHandle(handle),
        textureId,
        insetLeft,
        insetTop,
        insetRight,
        insetBottom,
        samplingKind,
        maxAniso
      );
    },
    ui_set_svg(handle, svgId, tintColor, samplingKind, maxAniso) {
      deps.getRuntime().ui._ui_set_svg(toBigIntHandle(handle), svgId, tintColor, samplingKind, maxAniso);
    },
    ui_set_linear_gradient(handle, startX, startY, endX, endY, stopCount, offsetsPtr, colorsPtr) {
      const normalizedStopCount = Math.max(0, stopCount);
      const colorBytes = deps.readAppBytes(colorsPtr, normalizedStopCount * 4);
      const colors = new Uint32Array(colorBytes.buffer, colorBytes.byteOffset, normalizedStopCount);
      deps.withUiGradientData(
        deps.readAppFloats(offsetsPtr, normalizedStopCount),
        new Uint32Array(colors),
        (uiOffsetsPtr, uiColorsPtr) => {
          const runtime = deps.getRuntime();
          runtime.ui._ui_set_linear_gradient(
            toBigIntHandle(handle),
            startX,
            startY,
            endX,
            endY,
            normalizedStopCount,
            uiOffsetsPtr,
            uiColorsPtr
          );
        }
      );
    },
    ui_set_clip_to_bounds(handle, clip) {
      deps.getRuntime().ui._ui_set_clip_to_bounds(toBigIntHandle(handle), clip);
    },
    ui_set_visibility(handle, visibility) {
      deps.getRuntime().ui._ui_set_visibility(toBigIntHandle(handle), visibility);
    },
    ui_set_interactive(handle, flag) {
      deps.getRuntime().ui._ui_set_interactive(toBigIntHandle(handle), flag);
    },
    ui_set_preserve_selection_on_pointer_down(handle, preserve) {
      const runtime = deps.getRuntime();
      const setPreserve = runtime.ui._ui_set_preserve_selection_on_pointer_down;
      if (typeof setPreserve !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_set_preserve_selection_on_pointer_down; run repo root ./build.sh and refresh the served runtime assets."
        );
        return;
      }
      setPreserve(toBigIntHandle(handle), preserve);
    },
    ui_set_editor_command_keys(handle, enabled) {
      const runtime = deps.getRuntime();
      const setEditorCommandKeys = runtime.ui._ui_set_editor_command_keys;
      if (typeof setEditorCommandKeys !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_set_editor_command_keys; run repo root ./build.sh and refresh the served runtime assets."
        );
        return;
      }
      setEditorCommandKeys(toBigIntHandle(handle), enabled);
    },
    ui_set_editor_accepts_tab(handle, enabled) {
      const runtime = deps.getRuntime();
      const setEditorAcceptsTab = runtime.ui._ui_set_editor_accepts_tab;
      if (typeof setEditorAcceptsTab !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_set_editor_accepts_tab; run repo root ./build.sh and refresh the served runtime assets."
        );
        return;
      }
      setEditorAcceptsTab(toBigIntHandle(handle), enabled);
    },
    ui_set_scroll_proxy_target(handle, scrollHandle) {
      deps.getRuntime().ui._ui_set_scroll_proxy_target(toBigIntHandle(handle), toBigIntHandle(scrollHandle));
    },
    ui_set_scroll_enabled(handle, enabledX, enabledY) {
      deps.getRuntime().ui._ui_set_scroll_enabled(toBigIntHandle(handle), enabledX, enabledY);
    },
    ui_set_scroll_friction(handle, friction) {
      deps.getRuntime().ui._ui_set_scroll_friction(toBigIntHandle(handle), friction);
    },
    ui_set_smooth_scrolling(handle, smoothScrolling) {
      deps.getRuntime().ui._ui_set_smooth_scrolling(toBigIntHandle(handle), smoothScrolling ? 1 : 0);
    },
    ui_set_scroll_content_size(handle, contentWidth, contentHeight) {
      deps.getRuntime().ui._ui_set_scroll_content_size(toBigIntHandle(handle), contentWidth, contentHeight);
    },
    ui_set_focusable(handle, flag, tabIndex) {
      deps.getRuntime().ui._ui_set_focusable(toBigIntHandle(handle), flag, tabIndex);
    },
    ui_request_focus(handle) {
      deps.getRuntime().ui._ui_request_focus(toBigIntHandle(handle));
    },
    ui_set_font(handle, fontId, size) {
      const runtime = deps.getRuntime();
      void runtime.ensureFont(fontId).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[fui_host] font ${String(fontId)} failed to load on demand: ${message}`);
      });
      runtime.ui._ui_set_font(toBigIntHandle(handle), fontId, size);
    },
    ui_set_line_height(handle, lineHeight) {
      deps.getRuntime().ui._ui_set_line_height(toBigIntHandle(handle), lineHeight);
    },
    ui_register_font_fallback(fontId, fallbackFontId) {
      deps.getRuntime().registerFontFallback(fontId, fallbackFontId);
    },
    ui_set_text_color(handle, color) {
      deps.getRuntime().ui._ui_set_text_color(toBigIntHandle(handle), color);
    },
    ui_set_text_align(handle, align) {
      deps.getRuntime().ui._ui_set_text_align(toBigIntHandle(handle), align);
    },
    ui_set_text_vertical_align(handle, align) {
      deps.getRuntime().ui._ui_set_text_vertical_align(toBigIntHandle(handle), align);
    },
    ui_set_text_limits(handle, maxChars, maxLines) {
      deps.getRuntime().ui._ui_set_text_limits(toBigIntHandle(handle), maxChars, maxLines);
    },
    ui_set_text_wrapping(handle, wrap) {
      deps.getRuntime().ui._ui_set_text_wrapping(toBigIntHandle(handle), wrap);
    },
    ui_set_text_overflow(handle, overflow) {
      deps.getRuntime().ui._ui_set_text_overflow(toBigIntHandle(handle), overflow);
    },
    ui_set_text_overflow_fade(handle, horizontal, vertical) {
      deps.getRuntime().ui._ui_set_text_overflow_fade(toBigIntHandle(handle), horizontal, vertical);
    },
    ui_set_text_obscured(handle, obscured) {
      deps.getRuntime().ui._ui_set_text_obscured(toBigIntHandle(handle), obscured);
    },
    ui_set_editable(handle, editable) {
      deps.getRuntime().ui._ui_set_editable(toBigIntHandle(handle), editable);
    },
    ui_set_caret_color(handle, color) {
      deps.getRuntime().ui._ui_set_caret_color(toBigIntHandle(handle), color);
    },
    ui_set_selectable(handle, selectable, selectionColor) {
      deps.getRuntime().ui._ui_set_selectable(toBigIntHandle(handle), selectable, selectionColor);
    },
    ui_set_selection_area(handle, isArea) {
      deps.getRuntime().ui._ui_set_selection_area(toBigIntHandle(handle), isArea);
    },
    ui_set_selection_area_barrier(handle, isBarrier) {
      deps.getRuntime().ui._ui_set_selection_area_barrier(toBigIntHandle(handle), isBarrier);
    },
    ui_clear_selection(handle) {
      deps.getRuntime().ui._ui_clear_selection(toBigIntHandle(handle));
    },
    ui_retarget_selection(fromHandle, toHandle) {
      deps.getRuntime().ui._ui_retarget_selection(toBigIntHandle(fromHandle), toBigIntHandle(toHandle));
    },
    ui_is_point_in_selection(x, y) {
      return deps.getRuntime().ui._ui_is_point_in_selection(x, y);
    },
    ui_set_text_selection_range(handle, selectionStart, selectionEnd) {
      deps.getRuntime().ui._ui_set_text_selection_range(toBigIntHandle(handle), selectionStart, selectionEnd);
    },
    ui_select_word_at(handle, x, y) {
      const runtime = deps.getRuntime();
      const selectWordAt = runtime.ui._ui_select_word_at;
      if (typeof selectWordAt !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_select_word_at; run repo root ./build.sh and refresh the served runtime assets."
        );
        return 0;
      }
      return selectWordAt(toBigIntHandle(handle), x, y);
    },
    ui_begin_selection_endpoint_drag(handle, endpoint) {
      const runtime = deps.getRuntime();
      const beginDrag = runtime.ui._ui_begin_selection_endpoint_drag;
      if (typeof beginDrag !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_begin_selection_endpoint_drag; run repo root ./build.sh and refresh the served runtime assets."
        );
        return 0;
      }
      return beginDrag(toBigIntHandle(handle), endpoint);
    },
    ui_get_text_range_rect_count(handle, start, end) {
      return deps.getRuntime().ui._ui_get_text_range_rect_count(toBigIntHandle(handle), start, end);
    },
    ui_copy_text_range_rects(handle, start, end, outRectWordsPtr, maxRectCount) {
      const runtime = deps.getRuntime();
      const clampedRectCount = Math.max(0, maxRectCount | 0);
      if (clampedRectCount === 0) {
        return 0;
      }
      const byteLength = clampedRectCount * 4 * 4;
      return withHeapAllocation(runtime.ui, byteLength, (heap) => {
        const copiedCount = runtime.ui._ui_copy_text_range_rects(
          toBigIntHandle(handle),
          start,
          end,
          heap.ptr,
          clampedRectCount
        );
        if (copiedCount === 0) {
          return 0;
        }
        const copiedBytes = copiedCount * 4 * 4;
        const uiBytes = copyBytesFromHeap(runtime.ui, heap.ptr, copiedBytes);
        const appMemory = deps.getCurrentMemory();
        const appBytes = new Uint8Array(appMemory.buffer, outRectWordsPtr, copiedBytes);
        appBytes.set(uiBytes);
        return copiedCount;
      });
    },
    ui_copy_cross_selection_endpoint_rects(areaHandle, outRectWordsPtr) {
      const runtime = deps.getRuntime();
      const copyEndpointRects = runtime.ui._ui_copy_cross_selection_endpoint_rects;
      if (typeof copyEndpointRects !== "function") {
        console.error(
          "[fui_host] UI runtime is missing _ui_copy_cross_selection_endpoint_rects; run repo root ./build.sh and refresh the served runtime assets."
        );
        return 0;
      }
      const byteLength = 8 * 4;
      return withHeapAllocation(runtime.ui, byteLength, (heap) => {
        const copied = copyEndpointRects(
          toBigIntHandle(areaHandle),
          heap.ptr
        );
        if (copied === 0) {
          return 0;
        }
        const uiBytes = copyBytesFromHeap(runtime.ui, heap.ptr, byteLength);
        const appMemory = deps.getCurrentMemory();
        const appBytes = new Uint8Array(appMemory.buffer, outRectWordsPtr, byteLength);
        appBytes.set(uiBytes);
        return 1;
      });
    },
    ui_clear_current_selection() {
      deps.getRuntime().ui._ui_clear_current_selection();
    },
    ui_copy_current_selection() {
      deps.getRuntime().ui._ui_copy_current_selection();
    },
    ui_can_undo_text_edit(handle) {
      return deps.getRuntime().ui._ui_can_undo_text_edit(toBigIntHandle(handle));
    },
    ui_can_redo_text_edit(handle) {
      return deps.getRuntime().ui._ui_can_redo_text_edit(toBigIntHandle(handle));
    },
    ui_has_text_selection(handle) {
      return deps.getRuntime().ui._ui_has_text_selection(toBigIntHandle(handle));
    },
    ui_undo_text_edit(handle) {
      deps.getRuntime().ui._ui_undo_text_edit(toBigIntHandle(handle));
    },
    ui_redo_text_edit(handle) {
      deps.getRuntime().ui._ui_redo_text_edit(toBigIntHandle(handle));
    },
    ui_copy_text_selection(handle) {
      deps.getRuntime().ui._ui_copy_text_selection(toBigIntHandle(handle));
    },
    ui_cut_text_selection(handle) {
      deps.getRuntime().ui._ui_cut_text_selection(toBigIntHandle(handle));
    },
    ui_replace_text_range(handle, start, end, ptr, len, caret) {
      deps.getRuntime().ui._ui_replace_text_range(toBigIntHandle(handle), start, end, ptr, len, caret);
    },
    ui_paste_text(handle) {
      deps.getRuntime().ui._ui_paste_text(toBigIntHandle(handle));
    },
    ui_select_all_text(handle) {
      deps.getRuntime().ui._ui_select_all_text(toBigIntHandle(handle));
    },
    ui_set_scroll_offset(handle, x, y) {
      deps.getRuntime().ui._ui_set_scroll_offset(toBigIntHandle(handle), x, y);
    },
    ui_clear_momentum_scroll() {
      deps.getRuntime().ui._ui_clear_momentum_scroll();
    },
    ui_get_bounds(handle, outX, outY, outWidth, outHeight) {
      const runtime = deps.getRuntime();
      const appMemory = deps.getCurrentMemory();
      return withHeapAllocation(runtime.ui, 16, (heap) => {
        const found = runtime.ui._ui_get_bounds(
          toBigIntHandle(handle),
          heap.ptr,
          addUiPointer(runtime, heap.ptr, 4),
          addUiPointer(runtime, heap.ptr, 8),
          addUiPointer(runtime, heap.ptr, 12)
        );
        if (found === 0) {
          return 0;
        }
        const uiView = new DataView(copyBytesFromHeap(runtime.ui, heap.ptr, heap.len).buffer);
        const appView = new DataView(appMemory.buffer);
        appView.setFloat32(outX, uiView.getFloat32(0, true), true);
        appView.setFloat32(outY, uiView.getFloat32(4, true), true);
        appView.setFloat32(outWidth, uiView.getFloat32(8, true), true);
        appView.setFloat32(outHeight, uiView.getFloat32(12, true), true);
        return 1;
      });
    },
    ui_get_visible_bounds(handle, outX, outY, outWidth, outHeight) {
      const runtime = deps.getRuntime();
      const appMemory = deps.getCurrentMemory();
      return withHeapAllocation(runtime.ui, 16, (heap) => {
        const found = runtime.ui._ui_get_visible_bounds(
          toBigIntHandle(handle),
          heap.ptr,
          addUiPointer(runtime, heap.ptr, 4),
          addUiPointer(runtime, heap.ptr, 8),
          addUiPointer(runtime, heap.ptr, 12)
        );
        if (found === 0) {
          return 0;
        }
        const uiView = new DataView(copyBytesFromHeap(runtime.ui, heap.ptr, heap.len).buffer);
        const appView = new DataView(appMemory.buffer);
        appView.setFloat32(outX, uiView.getFloat32(0, true), true);
        appView.setFloat32(outY, uiView.getFloat32(4, true), true);
        appView.setFloat32(outWidth, uiView.getFloat32(8, true), true);
        appView.setFloat32(outHeight, uiView.getFloat32(12, true), true);
        return 1;
      });
    },
    ui_get_text_metrics(handle, outWidth, outHeight, outBaseline, outLineCount, outMaxLineWidth) {
      const runtime = deps.getRuntime();
      const appMemory = deps.getCurrentMemory();
      return withHeapAllocation(runtime.ui, 20, (heap) => {
        const found = runtime.ui._ui_get_text_metrics(
          toBigIntHandle(handle),
          heap.ptr,
          addUiPointer(runtime, heap.ptr, 4),
          addUiPointer(runtime, heap.ptr, 8),
          addUiPointer(runtime, heap.ptr, 12),
          addUiPointer(runtime, heap.ptr, 16)
        );
        if (found === 0) {
          return 0;
        }
        const uiView = new DataView(copyBytesFromHeap(runtime.ui, heap.ptr, heap.len).buffer);
        const appView = new DataView(appMemory.buffer);
        appView.setFloat32(outWidth, uiView.getFloat32(0, true), true);
        appView.setFloat32(outHeight, uiView.getFloat32(4, true), true);
        appView.setFloat32(outBaseline, uiView.getFloat32(8, true), true);
        appView.setUint32(outLineCount, uiView.getUint32(12, true), true);
        appView.setFloat32(outMaxLineWidth, uiView.getFloat32(16, true), true);
        return 1;
      });
    },
    ui_set_text(handle, ptr, len) {
      const runtime = deps.getRuntime();
      const text = deps.readAppUtf8(ptr, len);
      deps.withUiUtf8(text, (uiPtr, uiLen) => {
        runtime.ui._ui_set_text(toBigIntHandle(handle), uiPtr, uiLen);
      });
      deps.recordTextChangedFromAppSet?.(handle, text);
    },
    ui_set_text_style_runs(handle, runCount, runsWordsPtr) {
      const runtime = deps.getRuntime();
      const clampedRunCount = Math.max(0, runCount | 0);
      if (clampedRunCount === 0) {
        runtime.ui._ui_set_text_style_runs(toBigIntHandle(handle), 0, deps.zeroPointer());
        return;
      }
      const byteLength = clampedRunCount * 7 * 4;
      const appPtr = Number(runsWordsPtr);
      const appBytes = new Uint8Array(deps.getCurrentMemory().buffer, appPtr, byteLength);
      const runs = new Uint32Array(appBytes.buffer, appBytes.byteOffset, clampedRunCount * 7);
      const requestedFonts = /* @__PURE__ */ new Set();
      for (let index = 0; index < clampedRunCount; index += 1) {
        const fontId = runs[index * 7 + 2] ?? 0;
        if (fontId !== 0) {
          requestedFonts.add(fontId);
        }
      }
      for (const fontId of requestedFonts) {
        void runtime.ensureFont(fontId).catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[fui_host] rich text font ${String(fontId)} failed to load on demand: ${message}`);
        });
      }
      withHeapBytes(runtime.ui, appBytes, (heap) => {
        runtime.ui._ui_set_text_style_runs(
          toBigIntHandle(handle),
          clampedRunCount,
          heap.ptr
        );
      });
    },
    ui_commit_frame() {
      const runtime = deps.getRuntime();
      runtime.commitFrame();
      deps.queueHarnessFrame();
    },
    ui_resize_window(width, height) {
      deps.getRuntime().ui._ui_resize_window(width, height);
    }
  };
}

// node_modules/@effindomv2/runtime/src/managed-harness/platform-host.ts
var BrowserManagedPlatformHost = class {
  nowMilliseconds() {
    return performance.now();
  }
  getDevicePixelRatio() {
    return window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  }
  isDarkMode() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  reload() {
    window.location.reload();
  }
  resolveUrl(target) {
    return new URL(target, window.location.href);
  }
  publishClipboard(payload) {
    const callbacks = window.__effindomCallbacks;
    callbacks?.onClipboardWrite?.(payload);
  }
  defer(callback) {
    return window.setTimeout(callback, 0);
  }
  setTimer(callback, delayMs) {
    return window.setTimeout(callback, delayMs);
  }
  clearTimer(timerId) {
    window.clearTimeout(timerId);
  }
};
var browserManagedPlatformHost = new BrowserManagedPlatformHost();

// node_modules/@effindomv2/runtime/src/managed-harness/managed-harness.ts
function tryResolveNavigationTarget(target) {
  try {
    return new URL(target, window.location.href);
  } catch {
    return null;
  }
}
function toAppRoute(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}
var encoder5 = new TextEncoder();
var harnessUiChrome = new HarnessUiChrome();
function isHandledResult(value) {
  return value === true || value === 1;
}
function applyHarnessRuntimeOptions(options) {
  const update = {};
  if (options.buildMode !== void 0) {
    update.buildMode = options.buildMode;
  }
  if (options.devToolsDomMirror !== void 0) {
    update.devToolsDomMirror = options.devToolsDomMirror;
  }
  if (options.pageZoom !== void 0) {
    update.pageZoom = options.pageZoom;
  }
  if (Object.keys(update).length === 0) {
    return;
  }
  const runtimeWindow = window;
  runtimeWindow.__effindomRuntime = Object.assign({}, runtimeWindow.__effindomRuntime, update);
}
function describeHarnessError(error) {
  return error instanceof Error ? error.message : String(error);
}
function startManagedHarness(options) {
  applyHarnessRuntimeOptions(options);
  let cleanup = () => {
    delete window.__fui_debug;
  };
  const loadingOverlayText = harnessUiChrome.getLoadingOverlayText();
  const loadingOverlayTitle = loadingOverlayText.title;
  let loadingOverlayDetail = loadingOverlayText.detail;
  let loadingOverlayVisible = false;
  let loadingOverlayTimer = null;
  function clearLoadingOverlayTimer() {
    if (loadingOverlayTimer === null) {
      return;
    }
    window.clearTimeout(loadingOverlayTimer);
    loadingOverlayTimer = null;
  }
  function scheduleLoadingOverlay() {
    if (loadingOverlayVisible || loadingOverlayTimer !== null) {
      return;
    }
    loadingOverlayTimer = window.setTimeout(() => {
      loadingOverlayTimer = null;
      loadingOverlayVisible = true;
      harnessUiChrome.setLoadingOverlay("loading", loadingOverlayTitle, loadingOverlayDetail);
    }, 1e3);
  }
  function updateLoadingOverlay(detail) {
    loadingOverlayDetail = detail;
    if (loadingOverlayVisible) {
      harnessUiChrome.setLoadingOverlay("loading", loadingOverlayTitle, loadingOverlayDetail);
      return;
    }
    scheduleLoadingOverlay();
  }
  function finishLoadingOverlay() {
    clearLoadingOverlayTimer();
    loadingOverlayVisible = false;
    harnessUiChrome.hideLoadingOverlay();
  }
  function failLoadingOverlay(detail) {
    clearLoadingOverlayTimer();
    loadingOverlayVisible = true;
    harnessUiChrome.setLoadingOverlay("error", loadingOverlayTitle, detail);
  }
  const bridge = window.EffinDomBrowserBridge;
  if (bridge === void 0) {
    failLoadingOverlay("EffinDomBrowserBridge is unavailable.");
    throw new Error("EffinDomBrowserBridge is unavailable.");
  }
  if (typeof Worker !== "function") {
    failLoadingOverlay("Managed harness requires browser Worker support.");
    throw new Error("Managed harness requires browser Worker support.");
  }
  const bridgeState = bridge;
  void bridgeState.ready.then(async (initialRuntime) => {
    assertCompatibleAbi(initialRuntime);
    ensureManagedHistoryInitialized();
    const debugLogsEnabled = new URLSearchParams(window.location.search).get("debug-logs") === "1";
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    let runtime = initialRuntime;
    let currentSession = null;
    let navigationHandler = null;
    let harnessFrameQueued = false;
    let appFlushRequested = false;
    let missingWheelExportLogged = false;
    const hostTimers = /* @__PURE__ */ new Map();
    let lastHandledUrlHref = window.location.href;
    let latestCommandWords = [];
    let latestRootHandle = null;
    const wasmByteCache = /* @__PURE__ */ new Map();
    const wasmModuleCache = /* @__PURE__ */ new Map();
    let lastSystemAccentColor = -1;
    harnessUiChrome.setUrlPreviewText("");
    function getCurrentSession() {
      if (currentSession === null) {
        throw new Error("No managed app is currently mounted.");
      }
      return currentSession;
    }
    function getCurrentMemory() {
      return getCurrentSession().memory;
    }
    const persistedUiStateController = new PersistedUiStateController();
    const textBridge = new TextSessionBridge(() => runtime, getCurrentMemory, queueHarnessFrame);
    let recordRuntimeTextChangedFromAppSet = null;
    function readAppUtf8(ptr, len) {
      return textBridge.readAppUtf8(ptr, len);
    }
    function readAppFloats(ptr, count) {
      return textBridge.readAppFloats(ptr, count);
    }
    function readAppBytes(ptr, len) {
      return textBridge.readAppBytes(ptr, len);
    }
    function readAppTextParts(ptr, len) {
      return textBridge.readAppTextParts(ptr, len);
    }
    function writeTextCallbackPayload(session, text, context) {
      return textBridge.writeTextCallbackPayload(session, text, context);
    }
    function writeWorkerTextCallbackPayload(session, text, context) {
      return textBridge.writeWorkerTextCallbackPayload(session, text, context);
    }
    function writeTextToSessionBuffer(session, text) {
      return textBridge.writeTextToSessionBuffer(session, text);
    }
    function writeAppFloat32(ptr, value) {
      textBridge.writeAppFloat32(ptr, value);
    }
    function writeAppUint32(ptr, value) {
      textBridge.writeAppUint32(ptr, value);
    }
    function writeAppUtf8(ptr, capacity, text, context) {
      return textBridge.writeAppUtf8(ptr, capacity, text, context);
    }
    function writeAppBytes(ptr, capacity, bytes, context) {
      if (capacity < 0) {
        throw new Error(`${context} has invalid buffer capacity ${String(capacity)}.`);
      }
      if (bytes.length > capacity) {
        throw new Error(`${context} returned ${String(bytes.length)} bytes but the shared result buffer only holds ${String(capacity)}.`);
      }
      if (bytes.length > 0) {
        new Uint8Array(getCurrentMemory().buffer, ptr, bytes.length).set(bytes);
      }
      return bytes.length;
    }
    function withUiUtf8(text, callback) {
      textBridge.withUiUtf8(text, callback);
    }
    function withUiGridData(values, types, callback) {
      textBridge.withUiGridData(values, types, callback);
    }
    function withUiGradientData(offsets, colors, callback) {
      textBridge.withUiGradientData(offsets, colors, callback);
    }
    const bitmapHost = createManagedHarnessBitmapHost({
      getRuntime: () => runtime,
      readAppBytes,
      writeAppBytes,
      notifyBitmapChanged() {
        appFlushRequested = true;
        runtime.requestFrame();
        queueHarnessFrame();
      }
    });
    bitmapHost.installReplay(runtime);
    const canvasHost = createManagedHarnessCanvasHost({
      getRuntime: () => runtime,
      readAppBytes,
      writeAppBytes
    });
    async function settleCurrentSessionAfterRestore(context) {
      const session = currentSession;
      if (session === null) {
        return;
      }
      for (let iteration = 0; iteration < 2; iteration += 1) {
        session.exports.__flushRenders();
        runtime.flushPendingCommit();
        await waitForFrame();
      }
      persistedUiStateController.restoreCurrentPersistedUiState(
        `${context} after initial paint`,
        currentSession?.exports.__fui_restore_persisted_ui_state
      );
      for (let iteration = 0; iteration < 2; iteration += 1) {
        session.exports.__flushRenders();
        runtime.flushPendingCommit();
        await waitForFrame();
      }
    }
    function updateState() {
      currentSession?.onStateUpdated?.({
        commandWordCount: latestCommandWords.length,
        commandWords: latestCommandWords,
        rootHandle: latestRootHandle
      });
    }
    function queueHarnessFrame() {
      if (harnessFrameQueued) {
        return;
      }
      harnessFrameQueued = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          latestCommandWords = Array.from(runtime.extractCommandBuffer());
          updateState();
          harnessFrameQueued = false;
        });
      });
    }
    function queuePersistedUiStateWork(work) {
      return persistedUiStateController.queuePersistedUiStateWork(work);
    }
    async function loadPopPersistedSnapshot(context, routeHref = window.location.href) {
      return persistedUiStateController.loadPopPersistedSnapshot(context, routeHref);
    }
    async function loadInitialPersistedSnapshot(context) {
      return persistedUiStateController.loadInitialPersistedSnapshot(context);
    }
    async function saveCurrentHistoryEntrySnapshot(context) {
      return persistedUiStateController.saveCurrentHistoryEntrySnapshot(
        context,
        currentSession?.exports.__fui_capture_persisted_ui_state
      );
    }
    async function saveRouteHeadSnapshotForHref(routeHref, context) {
      return persistedUiStateController.saveRouteHeadSnapshotForHref(
        routeHref,
        context,
        currentSession?.exports.__fui_capture_persisted_ui_state
      );
    }
    async function ensureCurrentHistoryEntrySnapshot(context) {
      return persistedUiStateController.ensureCurrentHistoryEntrySnapshot(
        context,
        currentSession?.exports.__fui_capture_persisted_ui_state
      );
    }
    function hydrateCurrentPersistedEntries(snapshot) {
      persistedUiStateController.hydrateCurrentPersistedEntries(snapshot);
    }
    function restoreCurrentPersistedUiState(context) {
      persistedUiStateController.restoreCurrentPersistedUiState(
        context,
        currentSession?.exports.__fui_restore_persisted_ui_state
      );
    }
    function resetUiState() {
      latestCommandWords = [];
      latestRootHandle = null;
      textBridge.clearState();
      updateState();
    }
    function cancelHostTimer(timerId) {
      const timeoutId = hostTimers.get(timerId);
      if (timeoutId === void 0) {
        return;
      }
      window.clearTimeout(timeoutId);
      hostTimers.delete(timerId);
    }
    function cancelAllHostTimers() {
      for (const timeoutId of hostTimers.values()) {
        window.clearTimeout(timeoutId);
      }
      hostTimers.clear();
    }
    function notifyRouteChanged(session, route) {
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const encoded = encoder5.encode(route);
      if (encoded.length > session.textBufferSize) {
        throw new Error("Route text exceeds the shared AssemblyScript text buffer.");
      }
      if (encoded.length > 0) {
        const memory = new Uint8Array(session.memory.buffer, session.textBufferPtr, encoded.length);
        memory.set(encoded);
      }
      session.exports.__fui_on_route_changed(session.textBufferPtr, encoded.length);
    }
    function notifyRouteForCurrentLocation(session = currentSession) {
      notifyRouteChanged(session, `${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
    function resolveHarnessBaseUrl() {
      const scripts = Array.from(document.scripts);
      for (let index = scripts.length - 1; index >= 0; index -= 1) {
        const source = scripts[index]?.src ?? "";
        if (source.endsWith("/harness.js") || source.endsWith("harness.js")) {
          return source;
        }
      }
      return window.location.href;
    }
    const harnessBaseUrl = resolveHarnessBaseUrl();
    const workerBootstrapUrl = new URL("./worker-bootstrap.js", harnessBaseUrl).toString();
    const fileHost = createManagedHarnessFileHost({
      getCurrentSession: () => currentSession,
      getRuntime: () => runtime,
      readAppUtf8,
      readAppBytes,
      writeTextCallbackPayload,
      describeHarnessError,
      workerBootstrapUrl,
      getCurrentWorkerHostServices: () => currentSession?.workerHostServices
    });
    const fetchHost = createManagedHarnessFetchHost({
      getCurrentSession: () => currentSession,
      readAppUtf8,
      readAppBytes,
      readAppTextParts,
      writeTextCallbackPayload,
      describeHarnessError
    });
    const workerManager = createWorkerManager({
      scriptBaseUrl: harnessBaseUrl,
      getCurrentSession: () => currentSession,
      getCurrentWorkerHostServices: () => currentSession?.workerHostServices,
      writeTextCallbackPayload: writeWorkerTextCallbackPayload
    });
    function notifyViewport(session = currentSession) {
      if (session === null) {
        return;
      }
      const rect = runtime.canvas.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : runtime.canvas.width;
      const height = rect.height > 0 ? rect.height : runtime.canvas.height;
      session.exports.__fui_on_viewport_changed(width, height);
    }
    function notifySystemTheme(session = currentSession, isDark = darkModeQuery.matches) {
      if (session === null) {
        return;
      }
      session.exports.__fui_on_system_dark_mode_changed(isDark);
      notifySystemAccentColor(session, true);
    }
    function notifySystemAccentColor(session = currentSession, force = false) {
      if (session === null) {
        return;
      }
      const accentColor = harnessUiChrome.readHostAccentColor() >>> 0;
      if (!force && accentColor === lastSystemAccentColor) {
        return;
      }
      lastSystemAccentColor = accentColor;
      const callback = session.exports.__fui_on_system_accent_color_changed;
      if (typeof callback === "function") {
        callback(accentColor);
      }
    }
    function encodeHostEventCallArgs(session, method, args) {
      function alignOffset(value, alignment) {
        return alignment <= 1 ? value : value + alignment - 1 & ~(alignment - 1);
      }
      function encodeTypedArrayArg(type, arg, context) {
        if (type === "bytes") {
          if (!(arg instanceof Uint8Array)) {
            throw new Error(`${context} must be a Uint8Array.`);
          }
          return { bytes: arg, elementCount: arg.length, alignment: 1 };
        }
        if (type === "i32_array") {
          if (!(arg instanceof Int32Array)) {
            throw new Error(`${context} must be an Int32Array.`);
          }
          return {
            bytes: new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength),
            elementCount: arg.length,
            alignment: 4
          };
        }
        if (type === "u32_array") {
          if (!(arg instanceof Uint32Array)) {
            throw new Error(`${context} must be a Uint32Array.`);
          }
          return {
            bytes: new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength),
            elementCount: arg.length,
            alignment: 4
          };
        }
        if (type === "i64_array") {
          if (!(arg instanceof BigInt64Array)) {
            throw new Error(`${context} must be a BigInt64Array.`);
          }
          return {
            bytes: new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength),
            elementCount: arg.length,
            alignment: 8
          };
        }
        if (type === "u64_array") {
          if (!(arg instanceof BigUint64Array)) {
            throw new Error(`${context} must be a BigUint64Array.`);
          }
          return {
            bytes: new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength),
            elementCount: arg.length,
            alignment: 8
          };
        }
        if (!(arg instanceof Float64Array)) {
          throw new Error(`${context} must be a Float64Array.`);
        }
        return {
          bytes: new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength),
          elementCount: arg.length,
          alignment: 8
        };
      }
      if (args.length != method.args.length) {
        throw new Error(`Host event ${method.serviceName}.${method.methodName} expected ${String(method.args.length)} args but received ${String(args.length)}.`);
      }
      const callArgs = [];
      let byteOffset = 0;
      for (let index = 0; index < method.args.length; index += 1) {
        const type = method.args[index];
        const arg = args[index];
        const context = `Host event ${method.serviceName}.${method.methodName} arg ${String(index)}`;
        if (type === "string") {
          if (typeof arg !== "string") {
            throw new Error(`${context} must be a string.`);
          }
          const encoded = encoder5.encode(arg);
          if (encoded.length > 0) {
            if (session.textBufferPtr === 0 || byteOffset + encoded.length > session.textBufferSize) {
              throw new Error(`${context} exceeds the shared AssemblyScript text buffer.`);
            }
            const memory = new Uint8Array(session.memory.buffer, session.textBufferPtr + byteOffset, encoded.length);
            memory.set(encoded);
            callArgs.push(session.textBufferPtr + byteOffset, encoded.length);
            byteOffset += encoded.length;
          } else {
            callArgs.push(0, 0);
          }
          continue;
        }
        if (type === "bytes" || type === "i32_array" || type === "u32_array" || type === "i64_array" || type === "u64_array" || type === "f64_array") {
          const payload = encodeTypedArrayArg(type, arg, context);
          if (payload.bytes.length > 0) {
            const alignedOffset = alignOffset(byteOffset, payload.alignment);
            if (session.textBufferPtr === 0 || alignedOffset + payload.bytes.length > session.textBufferSize) {
              throw new Error(`${context} exceeds the shared AssemblyScript text buffer.`);
            }
            const memory = new Uint8Array(session.memory.buffer, session.textBufferPtr + alignedOffset, payload.bytes.length);
            memory.set(payload.bytes);
            callArgs.push(session.textBufferPtr + alignedOffset, payload.elementCount);
            byteOffset = alignedOffset + payload.bytes.length;
          } else {
            callArgs.push(0, 0);
          }
          continue;
        }
        if (type === "bool") {
          if (typeof arg !== "boolean") {
            throw new Error(`${context} must be a boolean.`);
          }
          callArgs.push(arg ? 1 : 0);
          continue;
        }
        if (type === "i64" || type === "u64") {
          if (typeof arg !== "bigint") {
            throw new Error(`${context} must be a bigint.`);
          }
          if (type === "i64" && (arg < -9223372036854775808n || arg > 9223372036854775807n)) {
            throw new Error(`${context} must be a signed 64-bit integer.`);
          }
          if (type === "u64" && (arg < 0n || arg > 18446744073709551615n)) {
            throw new Error(`${context} must be an unsigned 64-bit integer.`);
          }
          callArgs.push(arg);
          continue;
        }
        if (typeof arg !== "number" || Number.isNaN(arg)) {
          throw new Error(`${context} must be a number.`);
        }
        if (type === "i32") {
          if (!Number.isInteger(arg) || arg < -2147483648 || arg > 2147483647) {
            throw new Error(`${context} must be a signed 32-bit integer.`);
          }
        } else if (type === "u32") {
          if (!Number.isInteger(arg) || arg < 0 || arg > 4294967295) {
            throw new Error(`${context} must be an unsigned 32-bit integer.`);
          }
        }
        callArgs.push(arg);
      }
      return callArgs;
    }
    function disposeHostEventDisposers(session) {
      const disposers = session.hostEventDisposers;
      while (disposers.length > 0) {
        const dispose = disposers.pop();
        dispose?.();
      }
    }
    function connectHostEvents(session, exports, hostEvents) {
      const exportRecord = exports;
      for (const method of listHostEventMethods(hostEvents)) {
        const exportedHandler = exportRecord[method.exportName];
        if (typeof exportedHandler !== "function") {
          console.error(
            `[fui_host_event] Missing wasm export "${method.exportName}" for ${method.serviceName}.${method.methodName}.`
          );
          continue;
        }
        const dispose = method.subscribe((...args) => {
          if (currentSession !== session) {
            return;
          }
          const activeHandler = exportRecord[method.exportName];
          if (typeof activeHandler !== "function") {
            console.error(
              `[fui_host_event] Lost wasm export "${method.exportName}" while dispatching ${method.serviceName}.${method.methodName}.`
            );
            return;
          }
          try {
            const callArgs = encodeHostEventCallArgs(session, method, args);
            activeHandler(...callArgs);
          } catch (error) {
            const message = error instanceof Error ? error.stack ?? error.message : String(error);
            console.error(
              `[fui_host_event] Dispatch failed for ${method.serviceName}.${method.methodName}: ${message}`
            );
            throw error;
          }
        });
        if (typeof dispose === "function") {
          session.hostEventDisposers.push(dispose);
        }
      }
    }
    function notifySvgLoaded(session, svgId, width, height) {
      if (session === null) {
        return;
      }
      session.exports.__fui_on_svg_loaded(svgId, width, height);
    }
    function notifySvgFailed(session, svgId, error) {
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const length = writeTextToSessionBuffer(session, error);
      session.exports.__fui_on_svg_failed(svgId, session.textBufferPtr, length);
    }
    function notifyTextureLoaded(session, textureId, width, height) {
      if (session === null) {
        return;
      }
      session.exports.__fui_on_texture_loaded(textureId, width, height);
    }
    function notifyTextureFailed(session, textureId, error) {
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const length = writeTextToSessionBuffer(session, error);
      session.exports.__fui_on_texture_failed(textureId, session.textBufferPtr, length);
    }
    async function handleSameOriginNavigation(target, mode) {
      const previousUrlHref = lastHandledUrlHref;
      if (mode !== "pop") {
        await queuePersistedUiStateWork(() => saveCurrentHistoryEntrySnapshot(`navigating ${mode} to ${target.href}`));
      } else if (previousUrlHref !== target.href) {
        await queuePersistedUiStateWork(() => saveRouteHeadSnapshotForHref(
          previousUrlHref,
          `leaving ${previousUrlHref} via ${mode} to ${target.href}`
        ));
      }
      if (navigationHandler !== null) {
        await navigationHandler(target, mode);
        lastHandledUrlHref = target.href;
        return;
      }
      if (mode === "push") {
        pushManagedHistoryEntry(target);
      } else if (mode === "replace") {
        replaceManagedHistoryEntry(target);
      }
      const targetSnapshot = mode === "pop" ? await queuePersistedUiStateWork(() => loadPopPersistedSnapshot(`navigating ${mode} to ${target.href}`, target.href)) : null;
      hydrateCurrentPersistedEntries(targetSnapshot);
      notifyRouteChanged(currentSession, toAppRoute(target));
      if (targetSnapshot !== null) {
        restoreCurrentPersistedUiState(`navigating ${mode} to ${target.href}`);
        await settleCurrentSessionAfterRestore(`navigating ${mode} to ${target.href}`);
      }
      await queuePersistedUiStateWork(() => ensureCurrentHistoryEntrySnapshot(`navigating ${mode} to ${target.href}`));
      lastHandledUrlHref = target.href;
    }
    function handleSameOriginNavigationFailure(target, mode, error) {
      const route = toAppRoute(target);
      const detail = `Failed to load ${mode === "pop" ? "history route" : "route"} ${route}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(error instanceof Error ? error.stack ?? error : error);
      failLoadingOverlay(detail);
      const windowWithHarnessError = window;
      windowWithHarnessError.__fuiAsReady = false;
      windowWithHarnessError.__fuiAsError = detail;
      options.onError?.(error);
    }
    function navigateWithinDocument(rawTarget, openInNewTab) {
      const target = tryResolveNavigationTarget(rawTarget);
      if (target === null) {
        throw new Error(`Invalid navigation target: ${rawTarget}`);
      }
      if (openInNewTab) {
        const anchor = document.createElement("a");
        anchor.href = target.href;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.hidden = true;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }
      const isWebUrl = target.protocol === "http:" || target.protocol === "https:";
      if (isWebUrl && target.origin === window.location.origin) {
        void handleSameOriginNavigation(target, "push").catch((error) => {
          handleSameOriginNavigationFailure(target, "push", error);
        });
        return;
      }
      window.location.assign(target.href);
    }
    async function flushDebugInteraction(session) {
      session.exports.__flushRenders();
      while (appFlushRequested) {
        appFlushRequested = false;
        session.exports.__flushRenders();
      }
      const words = runtime.flushPendingCommit();
      latestCommandWords = words === null ? [] : Array.from(words);
      updateState();
      await waitForFrame();
      updateState();
    }
    function syncUiHostCapabilities() {
      runtime.ui._ui_set_coarse_pointer_mode(harnessUiChrome.detectCoarsePointer() ? 1 : 0);
      runtime.ui._ui_set_platform_family(harnessUiChrome.detectPlatformFamily());
    }
    function createAppImports(hostServices) {
      const hostServiceImports = createHostServiceImportModule(hostServices, {
        readString: readAppUtf8,
        writeString: writeAppUtf8,
        readBytes: readAppBytes,
        writeBytes: writeAppBytes
      });
      return {
        effindom_v2_ui: createUiImportModule({
          getRuntime: () => runtime,
          readAppUtf8,
          readAppFloats,
          readAppBytes,
          withUiUtf8,
          withUiGridData,
          withUiGradientData,
          zeroPointer: () => zeroPointer(runtime),
          normalizePointer: (ptr) => normalizePointer(runtime, ptr),
          getCurrentMemory,
          setLatestRootHandle(rootHandle) {
            latestRootHandle = rootHandle;
          },
          updateState,
          queueHarnessFrame,
          syncUiHostCapabilities,
          resetUiState,
          recordTextChangedFromAppSet(handle, text) {
            textBridge.recordTextChanged(handle, text);
            recordRuntimeTextChangedFromAppSet?.(handle, text);
          }
        }),
        fui_host: {
          ...createHostImportModule({
            platformHost: browserManagedPlatformHost,
            getRuntime: () => runtime,
            getCurrentSession,
            getCurrentSessionOrNull: () => currentSession,
            setAppFlushRequested(value) {
              appFlushRequested = value;
            },
            queueHarnessFrame,
            uiChrome: harnessUiChrome,
            readAppUtf8,
            writeAppFloat32,
            writeAppUint32,
            writeAppUtf8,
            textBridge,
            persistedUiStateController,
            navigateWithinDocument,
            canBrowserNavigateBack,
            canBrowserNavigateForward,
            navigateBrowserBack,
            navigateBrowserForward,
            cancelHostTimer,
            getHostTimer(timerId) {
              return hostTimers.get(timerId);
            },
            setHostTimer(timerId, timeoutId) {
              hostTimers.set(timerId, timeoutId);
            },
            deleteHostTimer(timerId) {
              hostTimers.delete(timerId);
            },
            workerManager,
            debugLogsEnabled,
            notifySvgLoaded,
            notifySvgFailed,
            notifyTextureLoaded,
            notifyTextureFailed
          }),
          ...bitmapHost.imports,
          ...canvasHost.imports,
          ...fileHost.imports
        },
        fui_fetch_host: fetchHost.imports,
        fui_host_service: hostServiceImports
      };
    }
    const callbacks = window.__effindomCallbacks ?? {};
    const previousPointerCallback = callbacks.onPointerEventWithCoords;
    callbacks.onPointerEventWithCoords = (type, handle, x, y, modifiers) => {
      previousPointerCallback?.(type, handle, x, y, modifiers);
      const session = currentSession;
      if (session !== null) {
        return isHandledResult(session.exports.__fui_on_pointer_event_with_metadata(
          type,
          toBigIntHandle(handle),
          x,
          y,
          modifiers ?? 0,
          -1,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ));
      }
      return false;
    };
    const previousPointerMetadataCallback = callbacks.onPointerEventWithMetadata;
    callbacks.onPointerEventWithMetadata = (type, handle, x, y, modifiers, pointerId, pointerType, button, buttons, pressure, width, height, clickCount) => {
      previousPointerMetadataCallback?.(
        type,
        handle,
        x,
        y,
        modifiers,
        pointerId,
        pointerType,
        button,
        buttons,
        pressure,
        width,
        height,
        clickCount
      );
      previousPointerCallback?.(type, handle, x, y, modifiers);
      const session = currentSession;
      if (session === null) {
        return false;
      }
      return isHandledResult(session.exports.__fui_on_pointer_event_with_metadata(
        type,
        toBigIntHandle(handle),
        x,
        y,
        modifiers,
        pointerId,
        pointerType,
        button,
        buttons,
        pressure,
        width,
        height,
        clickCount
      ));
    };
    const previousWheelCallback = callbacks.onWheelEventWithCoords;
    callbacks.onWheelEventWithCoords = (handle, x, y, deltaX, deltaY, deltaMode, modifiers) => {
      const previousHandled = previousWheelCallback?.(handle, x, y, deltaX, deltaY, deltaMode, modifiers) === true;
      const session = currentSession;
      if (session === null) {
        return previousHandled;
      }
      const onWheelEvent = session.exports.__fui_on_wheel_event;
      if (typeof onWheelEvent !== "function") {
        if (!missingWheelExportLogged) {
          missingWheelExportLogged = true;
          console.error(
            "[fui_host] AssemblyScript app does not export __fui_on_wheel_event; rebuild the app with the current @effindomv2/fui-as exports."
          );
        }
        return previousHandled;
      }
      return previousHandled || onWheelEvent(
        toBigIntHandle(handle),
        x,
        y,
        deltaX,
        deltaY,
        deltaMode,
        modifiers
      ) !== 0;
    };
    callbacks.resolveGestureOwner = (handle) => {
      const session = currentSession;
      const resolveGestureOwner = session?.exports.__fui_resolve_gesture_owner;
      if (session === null || typeof resolveGestureOwner !== "function") {
        return null;
      }
      const owner = resolveGestureOwner(toBigIntHandle(handle));
      return owner === 0n ? null : owner;
    };
    callbacks.getGestureIntent = (handle) => {
      const session = currentSession;
      const getGestureIntent = session?.exports.__fui_get_gesture_intent;
      if (session === null || typeof getGestureIntent !== "function") {
        return 0;
      }
      return getGestureIntent(toBigIntHandle(handle));
    };
    callbacks.onGestureEventWithCoords = (handle, phase, kind, x, y, deltaX, deltaY, scale, pointerCount) => {
      const session = currentSession;
      const onGestureEvent = session?.exports.__fui_on_gesture_event;
      if (session === null || typeof onGestureEvent !== "function") {
        return false;
      }
      return isHandledResult(onGestureEvent(
        toBigIntHandle(handle),
        phase,
        kind,
        x,
        y,
        deltaX,
        deltaY,
        scale,
        pointerCount
      ));
    };
    callbacks.resolveLongPressOwner = (handle) => {
      const session = currentSession;
      const resolveLongPressOwner = session?.exports.__fui_resolve_long_press_owner;
      if (session === null || typeof resolveLongPressOwner !== "function") {
        return null;
      }
      const owner = resolveLongPressOwner(toBigIntHandle(handle));
      return owner === 0n ? null : owner;
    };
    callbacks.getLongPressMinimumDurationMs = (handle) => {
      const session = currentSession;
      const getLongPressMinimumDurationMs = session?.exports.__fui_get_long_press_minimum_duration_ms;
      if (session === null || typeof getLongPressMinimumDurationMs !== "function") {
        return 500;
      }
      return getLongPressMinimumDurationMs(toBigIntHandle(handle));
    };
    callbacks.getLongPressMovementTolerance = (handle) => {
      const session = currentSession;
      const getLongPressMovementTolerance = session?.exports.__fui_get_long_press_movement_tolerance;
      if (session === null || typeof getLongPressMovementTolerance !== "function") {
        return 10;
      }
      return getLongPressMovementTolerance(toBigIntHandle(handle));
    };
    callbacks.longPressContinuesPointerEvents = (handle) => {
      const session = currentSession;
      const continues = session?.exports.__fui_long_press_continues_pointer_events;
      return session !== null && typeof continues === "function" && isHandledResult(continues(toBigIntHandle(handle)));
    };
    callbacks.onLongPressEventWithCoords = (handle, x, y, pointerId, pointerType, modifiers, durationMs) => {
      const session = currentSession;
      const onLongPressEvent = session?.exports.__fui_on_long_press_event;
      if (session === null || typeof onLongPressEvent !== "function") {
        return false;
      }
      return isHandledResult(onLongPressEvent(
        toBigIntHandle(handle),
        x,
        y,
        pointerId,
        pointerType,
        modifiers,
        durationMs
      ));
    };
    const previousBeforeContextMenuHitTest = callbacks.onBeforeContextMenuHitTest;
    callbacks.onBeforeContextMenuHitTest = () => {
      previousBeforeContextMenuHitTest?.();
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_hide_active_context_menu();
      }
      runtime.commitFrame();
      runtime.flushPendingCommit();
      queueHarnessFrame();
    };
    const previousContextMenu = callbacks.onContextMenu;
    callbacks.onContextMenu = (handle, x, y) => {
      previousContextMenu?.(handle, x, y);
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_on_context_menu(toBigIntHandle(handle), x, y);
      }
    };
    callbacks.canShowContextMenu = (handle) => {
      const session = currentSession;
      if (session === null) {
        return true;
      }
      const canShowContextMenu = session.exports.__fui_can_show_context_menu;
      return typeof canShowContextMenu === "function" ? canShowContextMenu(toBigIntHandle(handle)) : true;
    };
    const previousFocusChanged = callbacks.onFocusChanged;
    callbacks.onFocusChanged = (handle, isFocused) => {
      previousFocusChanged?.(handle, isFocused);
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_on_focus_changed(toBigIntHandle(handle), isFocused);
        session.exports.__flushRenders();
      }
    };
    const previousFontLoaded = callbacks.onFontLoaded;
    callbacks.onFontLoaded = (fontId) => {
      previousFontLoaded?.(fontId);
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_on_font_loaded(fontId);
        session.exports.__flushRenders();
        runtime.flushPendingCommit();
      }
    };
    const previousMissingFontCoverage = callbacks.onMissingFontCoverage;
    callbacks.onMissingFontCoverage = (fontId, coverageKind, sampleText) => {
      if (previousMissingFontCoverage !== void 0) {
        previousMissingFontCoverage(fontId, coverageKind, sampleText);
        return;
      }
      runtime.logs.missingFontCoverageRequests.push({
        fontId,
        coverageKind,
        sampleText
      });
      runtime.handleMissingFontCoverage(fontId, coverageKind, sampleText);
    };
    const previousTextChanged = callbacks.onTextChanged;
    recordRuntimeTextChangedFromAppSet = previousTextChanged === void 0 ? null : (handle, text) => {
      previousTextChanged(toBigIntHandle(handle), text);
    };
    callbacks.onTextChanged = (handle, text) => {
      previousTextChanged?.(handle, text);
      textBridge.recordTextChanged(toBigIntHandle(handle), text);
      const session = currentSession;
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const length = writeTextCallbackPayload(session, text, "Text changed payload");
      session.exports.__fui_on_text_changed(
        toBigIntHandle(handle),
        length > 0 ? session.textBufferPtr : 0,
        length
      );
      session.exports.__flushRenders();
      runtime.flushPendingCommit();
    };
    const previousTextReplaced = callbacks.onTextReplaced;
    callbacks.onTextReplaced = (handle, start, end, text) => {
      previousTextReplaced?.(handle, start, end, text);
      textBridge.recordTextReplaced(toBigIntHandle(handle), start, end, text);
      const session = currentSession;
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const length = writeTextCallbackPayload(session, text, "Text replacement payload");
      session.exports.__fui_on_text_replaced(
        toBigIntHandle(handle),
        start,
        end,
        length > 0 ? session.textBufferPtr : 0,
        length
      );
      session.exports.__flushRenders();
      runtime.flushPendingCommit();
    };
    const previousSelectionChanged = callbacks.onSelectionChanged;
    callbacks.onSelectionChanged = (handle, start, end) => {
      previousSelectionChanged?.(handle, start, end);
      textBridge.recordSelectionChanged(toBigIntHandle(handle), start, end);
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_on_selection_changed(toBigIntHandle(handle), start, end);
        session.exports.__flushRenders();
        runtime.flushPendingCommit();
      }
    };
    const previousCrossSelectionChanged = callbacks.onCrossSelectionChanged;
    callbacks.onCrossSelectionChanged = (handle, text) => {
      previousCrossSelectionChanged?.(handle, text);
      const session = currentSession;
      if (session === null || session.textBufferPtr === 0 || session.textBufferSize === 0) {
        return;
      }
      const length = writeTextCallbackPayload(session, text, "Cross-selection payload");
      session.exports.__fui_on_cross_selection_changed(toBigIntHandle(handle), session.textBufferPtr, length);
    };
    const previousKeyEvent = callbacks.onKeyEventWithKey;
    callbacks.onKeyEventWithKey = (type, key, modifiers) => {
      const previousHandled = previousKeyEvent?.(type, key, modifiers) === true;
      const session = currentSession;
      if (session === null || session.keyBufferPtr === 0) {
        return previousHandled;
      }
      const encoded = encoder5.encode(key);
      if (encoded.length > 256) {
        return previousHandled;
      }
      const memory = new Uint8Array(session.memory.buffer, session.keyBufferPtr, encoded.length);
      memory.set(encoded);
      const handled = previousHandled || session.exports.__fui_on_key_event(type, session.keyBufferPtr, encoded.length, modifiers) !== 0;
      session.exports.__flushRenders();
      return handled;
    };
    const previousScroll = callbacks.onScroll;
    callbacks.onScroll = (handle, offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight) => {
      previousScroll?.(handle, offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight);
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_on_scroll(
          toBigIntHandle(handle),
          offsetX,
          offsetY,
          contentWidth,
          contentHeight,
          viewportWidth,
          viewportHeight
        );
      }
    };
    window.__effindomCallbacks = callbacks;
    const handleViewportChange = () => {
      notifyViewport();
    };
    window.addEventListener("resize", handleViewportChange);
    const handleDarkModeChange = (event) => {
      notifySystemTheme(currentSession, event.matches);
    };
    darkModeQuery.addEventListener("change", handleDarkModeChange);
    const handleWindowFocus = () => {
      notifySystemAccentColor();
    };
    window.addEventListener("focus", handleWindowFocus);
    const handlePopState = () => {
      const target = new URL(window.location.href);
      syncManagedHistoryPop(target);
      void handleSameOriginNavigation(target, "pop").catch((error) => {
        handleSameOriginNavigationFailure(target, "pop", error);
      });
    };
    window.addEventListener("popstate", handlePopState);
    const dismissTransientUi = () => {
      const session = currentSession;
      if (session !== null) {
        session.exports.__fui_hide_active_context_menu();
      }
      runtime.clearPointerHover();
      harnessUiChrome.setUrlPreviewText("");
    };
    const handleWindowBlur = () => {
      dismissTransientUi();
    };
    const handleCanvasBlur = () => {
      dismissTransientUi();
    };
    const handleCanvasDragEnter = (event) => {
      const effect = fileHost.dispatchExternalDragEvent(EXTERNAL_DRAG_EVENT_ENTER, event, { reuseActiveItems: false });
      if (effect === 0) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer !== null) {
        event.dataTransfer.dropEffect = fileHost.mapExternalDropEffect(effect);
      }
    };
    const handleCanvasDragOver = (event) => {
      const effect = fileHost.dispatchExternalDragEvent(EXTERNAL_DRAG_EVENT_OVER, event);
      if (effect === 0) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer !== null) {
        event.dataTransfer.dropEffect = fileHost.mapExternalDropEffect(effect);
      }
    };
    const handleCanvasDragLeave = (event) => {
      const effect = fileHost.dispatchExternalDragEvent(EXTERNAL_DRAG_EVENT_LEAVE, event, { handle: 0n });
      if (effect !== 0) {
        event.preventDefault();
      }
    };
    const handleCanvasDrop = (event) => {
      const effect = fileHost.dispatchExternalDragEvent(EXTERNAL_DRAG_EVENT_DROP, event);
      if (effect === 0) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer !== null) {
        event.dataTransfer.dropEffect = fileHost.mapExternalDropEffect(effect);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        notifySystemAccentColor();
        return;
      }
      dismissTransientUi();
      void queuePersistedUiStateWork(() => saveCurrentHistoryEntrySnapshot("visibility change"));
    };
    const handlePageHide = () => {
      void queuePersistedUiStateWork(() => saveCurrentHistoryEntrySnapshot("page hide"));
    };
    const canvasDragEnterListener = (event) => {
      handleCanvasDragEnter(event);
    };
    const canvasDragOverListener = (event) => {
      handleCanvasDragOver(event);
    };
    const canvasDragLeaveListener = (event) => {
      handleCanvasDragLeave(event);
    };
    const canvasDropListener = (event) => {
      handleCanvasDrop(event);
    };
    const externalDragTargets = [];
    const registerExternalDragTarget = (target) => {
      if (target === null) {
        return;
      }
      for (const externalDragTarget of externalDragTargets) {
        if (externalDragTarget === target) {
          return;
        }
      }
      externalDragTargets.push(target);
    };
    registerExternalDragTarget(runtime.canvas);
    registerExternalDragTarget(runtime.canvas.parentElement);
    registerExternalDragTarget(harnessUiChrome.getCanvasSizeSource(runtime.canvas));
    window.addEventListener("blur", handleWindowBlur);
    runtime.canvas.addEventListener("blur", handleCanvasBlur);
    for (const target of externalDragTargets) {
      target.addEventListener("dragenter", canvasDragEnterListener);
      target.addEventListener("dragover", canvasDragOverListener);
      target.addEventListener("dragleave", canvasDragLeaveListener);
      target.addEventListener("drop", canvasDropListener);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    cleanup = () => {
      workerManager.terminateAll();
      harnessUiChrome.setUrlPreviewText("");
      window.removeEventListener("resize", handleViewportChange);
      darkModeQuery.removeEventListener("change", handleDarkModeChange);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
      runtime.canvas.removeEventListener("blur", handleCanvasBlur);
      for (const target of externalDragTargets) {
        target.removeEventListener("dragenter", canvasDragEnterListener);
        target.removeEventListener("dragover", canvasDragOverListener);
        target.removeEventListener("dragleave", canvasDragLeaveListener);
        target.removeEventListener("drop", canvasDropListener);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      delete window.__fui_debug;
    };
    const debugApi = {
      async flush() {
        await flushDebugInteraction(getCurrentSession());
      },
      getDebugTree() {
        return Promise.resolve(runtime.getDebugTree());
      },
      async externalDragEvent(type, handle, x, y, files) {
        const session = getCurrentSession();
        const dataTransfer = new DataTransfer();
        for (const file of files) {
          dataTransfer.items.add(new File([file.text], file.name, {
            type: file.type ?? "application/octet-stream"
          }));
        }
        const eventName = type === EXTERNAL_DRAG_EVENT_ENTER ? "dragenter" : type === EXTERNAL_DRAG_EVENT_OVER ? "dragover" : type === EXTERNAL_DRAG_EVENT_LEAVE ? "dragleave" : "drop";
        const event = new DragEvent(eventName, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          dataTransfer
        });
        const effect = fileHost.dispatchExternalDragEvent(type, event, {
          handle: toBigIntHandle(handle),
          reuseActiveItems: type !== EXTERNAL_DRAG_EVENT_ENTER
        });
        await flushDebugInteraction(session);
        return effect;
      },
      async pointerEvent(type, handle, x, y, modifiers = 0) {
        const session = getCurrentSession();
        const debugPointerEvent = session.exports.__fui_debug_pointer_event;
        if (debugPointerEvent === void 0) {
          throw new Error("Debug pointer events are not available for this app.");
        }
        debugPointerEvent(type, toBigIntHandle(handle), x, y, modifiers);
        await flushDebugInteraction(session);
      },
      async focusChanged(handle, focused) {
        const session = getCurrentSession();
        const debugFocusChanged = session.exports.__fui_debug_focus_changed;
        if (debugFocusChanged === void 0) {
          throw new Error("Debug focus changes are not available for this app.");
        }
        debugFocusChanged(toBigIntHandle(handle), focused);
        await flushDebugInteraction(session);
      },
      async keyEvent(type, key, modifiers = 0) {
        const session = getCurrentSession();
        const debugKeyEvent = session.exports.__fui_debug_key_event;
        if (session.keyBufferPtr === 0 || debugKeyEvent === void 0) {
          throw new Error("Debug key events are not available for this app.");
        }
        const encoded = encoder5.encode(key);
        if (encoded.length > 256) {
          throw new Error("Debug key event exceeds the shared AssemblyScript key buffer.");
        }
        const memory = new Uint8Array(session.memory.buffer, session.keyBufferPtr, encoded.length);
        memory.set(encoded);
        debugKeyEvent(type, session.keyBufferPtr, encoded.length, modifiers);
        await flushDebugInteraction(session);
      },
      navigateTo(target) {
        navigateWithinDocument(target, false);
        return Promise.resolve();
      },
      async scroll(handle, offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight) {
        const session = getCurrentSession();
        const debugScroll = session.exports.__fui_debug_scroll;
        if (debugScroll === void 0) {
          throw new Error("Debug scroll events are not available for this app.");
        }
        debugScroll(
          toBigIntHandle(handle),
          offsetX,
          offsetY,
          contentWidth,
          contentHeight,
          viewportWidth,
          viewportHeight
        );
        await flushDebugInteraction(session);
      }
    };
    window.__fui_debug = debugApi;
    async function fetchWasmBytes(wasmPath) {
      const cached = wasmByteCache.get(wasmPath);
      if (cached !== void 0) {
        return cached;
      }
      const fetchPromise = fetch(wasmPath, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load wasm app: ${wasmPath}`);
        }
        return response.arrayBuffer();
      });
      wasmByteCache.set(wasmPath, fetchPromise);
      return fetchPromise;
    }
    async function loadWasmModule(wasmPath) {
      const cached = wasmModuleCache.get(wasmPath);
      if (cached !== void 0) {
        return cached;
      }
      const compilePromise = fetchWasmBytes(wasmPath).then((bytes) => WebAssembly.compile(bytes));
      wasmModuleCache.set(wasmPath, compilePromise);
      return compilePromise;
    }
    function validateAppImports(wasmModule, hostServices) {
      const allowedHostServiceImports = getHostServiceImportNames(hostServices);
      for (const imported of WebAssembly.Module.imports(wasmModule)) {
        if (imported.kind !== "function") {
          throw new Error(`App import ${imported.module}.${imported.name} is not allowed.`);
        }
        if (imported.module === "effindom_v2_ui" || imported.module === "fui_host" || imported.module === "fui_fetch_host" || imported.module === "env") {
          continue;
        }
        if (imported.module === "fui_host_service" && allowedHostServiceImports.has(imported.name)) {
          continue;
        }
        throw new Error(`App import ${imported.module}.${imported.name} is not allowed.`);
      }
    }
    async function unloadApp() {
      const session = currentSession;
      if (session === null) {
        return;
      }
      disposeHostEventDisposers(session);
      session.onDispose?.(session.exports);
      fetchHost.cancelAllForSession(session);
      fileHost.cancelAllForSession(session);
      currentSession = null;
      workerManager.terminateAll();
      appFlushRequested = false;
      cancelAllHostTimers();
      bitmapHost.clearTextures(runtime);
      runtime.setAppFrameHandler(null);
      runtime.setCapturedPointerHandle(null);
      runtime.clearPointerHover();
      runtime.canvas.style.cursor = "default";
      harnessUiChrome.setUrlPreviewText("");
      runtime.core._ed_clear_focus_state?.();
      runtime.core._ed_clear_text_input_state?.();
      runtime.core._ed_reset_scene();
      runtime.ui._ui_reset();
      syncUiHostCapabilities();
      resetUiState();
      runtime.resetLogs();
      runtime.commitFrame();
      queueHarnessFrame();
      runtime.flushPendingCommit();
      await waitForFrame();
    }
    async function recreateRuntime() {
      const session = currentSession;
      if (session !== null) {
        disposeHostEventDisposers(session);
        session.onDispose?.(session.exports);
        fetchHost.cancelAllForSession(session);
        fileHost.cancelAllForSession(session);
        currentSession = null;
      }
      workerManager.terminateAll();
      appFlushRequested = false;
      cancelAllHostTimers();
      bitmapHost.clearTextures(runtime);
      runtime.setAppFrameHandler(null);
      runtime.setCapturedPointerHandle(null);
      runtime.clearPointerHover();
      harnessUiChrome.setUrlPreviewText("");
      latestCommandWords = [];
      latestRootHandle = null;
      updateState();
      runtime = await bridgeState.recreateRuntime();
      assertCompatibleAbi(runtime);
      bitmapHost.installReplay(runtime);
      syncUiHostCapabilities();
      resetUiState();
      return runtime;
    }
    async function loadApp(loadOptions) {
      if (loadOptions.showLoadingOverlay !== false) {
        updateLoadingOverlay(`Loading ${loadOptions.wasmPath}`);
      }
      await unloadApp();
      const restoredSnapshot = await queuePersistedUiStateWork(() => {
        switch (loadOptions.persistedRestoreMode ?? "initial") {
          case "none":
            return Promise.resolve(null);
          case "pop":
            return loadPopPersistedSnapshot(`loading ${loadOptions.wasmPath}`);
          case "initial":
          default:
            return loadInitialPersistedSnapshot(`loading ${loadOptions.wasmPath}`);
        }
      });
      hydrateCurrentPersistedEntries(restoredSnapshot);
      const wasmModule = await loadWasmModule(loadOptions.wasmPath);
      validateAppImports(wasmModule, loadOptions.hostServices);
      const instance = await instantiate(wasmModule, createAppImports(loadOptions.hostServices));
      const exports = instance.exports;
      const keyBufferPtr = exports.__fui_key_buffer();
      const textBufferPtr = exports.__fui_text_buffer();
      const textBufferSize = textBufferPtr !== 0 ? exports.__fui_text_buffer_size() : 0;
      const sessionBase = {
        exports,
        memory: exports.memory,
        keyBufferPtr,
        textBufferPtr,
        textBufferSize,
        hostEventDisposers: []
      };
      const session = {
        ...sessionBase,
        ...loadOptions.workerHostServices === void 0 ? {} : { workerHostServices: loadOptions.workerHostServices },
        ...loadOptions.onStateUpdated === void 0 ? {} : { onStateUpdated: loadOptions.onStateUpdated },
        ...loadOptions.onDispose === void 0 ? {} : { onDispose: (activeExports) => {
          loadOptions.onDispose?.(activeExports);
        } }
      };
      currentSession = session;
      window.__effindomV2CustomDraw = (handleLo, handleHi, canvasPtrLo, canvasPtrHi = 0) => {
        const handle = BigInt(handleHi >>> 0) << 32n | BigInt(handleLo >>> 0);
        const canvasPtr = BigInt(canvasPtrHi >>> 0) << 32n | BigInt(canvasPtrLo >>> 0);
        const canvasToken = canvasHost.tokenForCanvasPointer(canvasPtr);
        const rawExports = exports;
        if (typeof rawExports.fui_dispatch_custom_draw === "function") {
          rawExports.fui_dispatch_custom_draw(handle, canvasToken);
        }
      };
      notifyRouteForCurrentLocation(session);
      runtime.setAppFrameHandler((timestampMs) => {
        if (currentSession !== session) {
          return;
        }
        exports.__fui_on_frame(timestampMs);
        appFlushRequested = false;
        exports.__flushRenders();
      });
      runtime.resetLogs();
      loadOptions.run(exports);
      connectHostEvents(session, exports, loadOptions.hostEvents);
      runtime.runAppFrameHandler(performance.now());
      notifyViewport(session);
      notifySystemTheme(session);
      if (restoredSnapshot !== null) {
        restoreCurrentPersistedUiState(`loading ${loadOptions.wasmPath}`);
        await settleCurrentSessionAfterRestore(`loading ${loadOptions.wasmPath}`);
      }
      const context = {
        runtime,
        exports,
        waitForFrame
      };
      await loadOptions.onReady?.(context);
      runtime.clearPointerHover();
      runtime.refreshPointerHover();
      runtime.flushPendingCommit();
      await waitForFrame();
      await queuePersistedUiStateWork(() => ensureCurrentHistoryEntrySnapshot(`loading ${loadOptions.wasmPath}`));
      lastHandledUrlHref = window.location.href;
      updateState();
      finishLoadingOverlay();
      return context;
    }
    const controller = {
      get runtime() {
        return runtime;
      },
      waitForFrame,
      loadApp,
      unloadApp,
      recreateRuntime,
      setSameOriginNavigationHandler(handler) {
        navigationHandler = handler;
      }
    };
    await options.onReady?.(controller);
  }).catch((error) => {
    cleanup();
    const message = error instanceof Error ? error.message : String(error);
    console.error(error instanceof Error ? error.stack ?? error : error);
    failLoadingOverlay(message);
    const windowWithHarnessError = window;
    windowWithHarnessError.__fuiAsReady = false;
    windowWithHarnessError.__fuiAsError = message;
    options.onError?.(error);
    throw error;
  });
}

// node_modules/@effindomv2/runtime/src/routed-harness.ts
function normalizeRoutePath(pathname, routeBase, routeByPath, fallbackRoutePath) {
  let normalized = pathname;
  if (normalized.endsWith("/index.html")) {
    normalized = normalized.slice(0, -"index.html".length);
  }
  if (!normalized.endsWith("/")) {
    normalized += "/";
  }
  if (normalized === routeBase) {
    return fallbackRoutePath;
  }
  return routeByPath.has(normalized) ? normalized : fallbackRoutePath;
}
function resolveRouteMatchPath(route) {
  return route.matchPath ?? route.routePath;
}
function currentBrowserPath() {
  let pathname = window.location.pathname;
  if (pathname.endsWith("/index.html")) {
    pathname = pathname.slice(0, -"index.html".length);
  }
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}
function startRoutedHarness(config) {
  if (config.routes.length === 0) {
    throw new Error("startRoutedHarness requires at least one route.");
  }
  const routeByPath = new Map(config.routes.map((route) => [resolveRouteMatchPath(route), route]));
  const fallbackRoute = config.routes[0];
  if (fallbackRoute === void 0) {
    throw new Error("startRoutedHarness requires at least one route.");
  }
  const defaultRoute = fallbackRoute;
  const routeLoads = {};
  let activeRoute = null;
  let navigationQueue = Promise.resolve();
  function resolveRoute(pathname) {
    const normalizedPath = normalizeRoutePath(
      pathname,
      config.routeBase,
      routeByPath,
      resolveRouteMatchPath(defaultRoute)
    );
    const resolved = routeByPath.get(normalizedPath);
    if (resolved !== void 0) {
      return resolved;
    }
    return defaultRoute;
  }
  function sameBrowserLocation(route) {
    return currentBrowserPath() === resolveRouteMatchPath(route);
  }
  function buildManagerState(route) {
    return {
      shellId: config.shellId,
      routePath: route.routePath,
      activeWasmPath: route.wasmPath,
      routeLoads: { ...routeLoads }
    };
  }
  async function navigateToRoute(controller, targetUrl, mode) {
    const route = resolveRoute(targetUrl.pathname);
    if (mode !== "pop" && sameBrowserLocation(route) && activeRoute?.routePath === route.routePath) {
      config.onRouteReady?.(buildManagerState(route), route);
      return;
    }
    const destination = new URL(route.routePath, window.location.origin);
    destination.search = targetUrl.search;
    destination.hash = targetUrl.hash;
    if (mode === "push") {
      pushManagedHistoryEntry(destination);
    } else if (mode === "replace" && !sameBrowserLocation(route)) {
      replaceManagedHistoryEntry(destination);
    }
    config.onRouteLoading?.(route);
    const isWarmRouteSwap = activeRoute !== null;
    if (isWarmRouteSwap && config.recreateRuntimeOnWarmRouteSwap === true) {
      await controller.recreateRuntime();
    }
    const persistedRestoreMode = activeRoute === null ? "initial" : mode === "pop" ? "pop" : "none";
    const appOptionsBase = {
      wasmPath: route.wasmPath,
      persistedRestoreMode,
      run(exports) {
        config.run(exports, route);
      },
      onDispose(exports) {
        config.onDispose?.(exports, route);
      },
      onStateUpdated(state) {
        config.onHarnessStateUpdated?.(state);
      }
    };
    const appOptions = {
      ...appOptionsBase,
      ...config.hostEvents === void 0 ? {} : { hostEvents: config.hostEvents },
      ...config.hostServices === void 0 ? {} : { hostServices: config.hostServices },
      ...config.workerHostServices === void 0 ? {} : { workerHostServices: config.workerHostServices }
    };
    const showLoadingOverlay = config.showLoadingOverlay?.(isWarmRouteSwap, route);
    appOptions.showLoadingOverlay = showLoadingOverlay ?? !isWarmRouteSwap;
    await controller.loadApp(appOptions);
    routeLoads[route.routePath] = (routeLoads[route.routePath] ?? 0) + 1;
    activeRoute = route;
    config.onRouteReady?.(buildManagerState(route), route);
  }
  startManagedHarness({
    ...config.buildMode === void 0 ? {} : { buildMode: config.buildMode },
    ...config.devToolsDomMirror === void 0 ? {} : { devToolsDomMirror: config.devToolsDomMirror },
    ...config.pageZoom === void 0 ? {} : { pageZoom: config.pageZoom },
    onReady: async (controller) => {
      controller.setSameOriginNavigationHandler((target, mode) => {
        navigationQueue = navigationQueue.then(() => navigateToRoute(controller, target, mode));
        return navigationQueue;
      });
      config.onBooting?.();
      await navigateToRoute(controller, new URL(window.location.href), "replace");
    },
    onError(error) {
      config.onHarnessError?.(error);
    }
  });
}

// host/host-events.ts
function nowUnixSeconds() {
  return Math.floor(Date.now() / 1e3);
}
var appHostEvents = defineHostEvents({
  appClock: {
    tick: hostEvent({
      args: ["i32"],
      subscribe(emit) {
        emit(nowUnixSeconds());
        const timer = setInterval(() => {
          emit(nowUnixSeconds());
        }, 1e3);
        return () => {
          clearInterval(timer);
        };
      }
    })
  }
});

// host/host-services.ts
function nowUnixSeconds2() {
  return Math.floor(Date.now() / 1e3);
}
var appHostServices = defineHostServices({
  appClock: {
    nowUnixSeconds: hostService({
      args: [],
      returns: "i32",
      implementation() {
        return nowUnixSeconds2();
      }
    })
  }
});

// routes.json
var routes_default = {
  routes: [
    {
      key: "home",
      routePath: "/",
      wasmPath: "/home.wasm",
      title: "Home"
    },
    {
      key: "text-fonts",
      routePath: "/text-fonts/",
      wasmPath: "/text-fonts.wasm",
      title: "Text & Fonts"
    },
    {
      key: "advanced",
      routePath: "/advanced/",
      wasmPath: "/advanced.wasm",
      title: "Advanced"
    },
    {
      key: "immediate-drawing",
      routePath: "/immediate-drawing/",
      wasmPath: "/immediate-drawing.wasm",
      title: "Immediate Drawing"
    }
  ]
};

// harness.ts
var routes = routes_default.routes;
startRoutedHarness({
  shellId: "fui-routes",
  routeBase: "/",
  routes,
  hostEvents: appHostEvents,
  hostServices: appHostServices,
  workerHostServices: {
    scriptUrl: new URL("./worker-host-services.js", import.meta.url).toString(),
    exportName: "demoWorkerHostServices"
  },
  recreateRuntimeOnWarmRouteSwap: true,
  run(exports) {
    exports.__runApp();
  },
  onDispose(exports) {
    exports.__disposeApp?.();
  }
});
