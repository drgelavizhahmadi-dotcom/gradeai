// Custom TypeScript declaration for the DOMMatrix polyfill

// Override type definitions to ensure compatibility
interface Float32Array {
  buffer: ArrayBuffer;
}

interface Float64Array {
  buffer: ArrayBuffer;
}

// Override global type definition for ArrayBufferLike
interface ArrayBufferLike {
  readonly byteLength: number;
  slice(begin: number, end?: number): ArrayBuffer;
}