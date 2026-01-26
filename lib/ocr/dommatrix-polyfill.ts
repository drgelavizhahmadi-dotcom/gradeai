// DOMMatrix polyfill for Node.js - MUST be imported before pdfjs-dist
// Using internal class name to avoid TypeScript type conflicts with global DOMMatrix

// CRITICAL: Set up a placeholder global DOMMatrix IMMEDIATELY before any imports
// This prevents "DOMMatrix is not defined" during module evaluation
if (typeof globalThis !== 'undefined' && typeof globalThis.DOMMatrix === 'undefined') {
  // Temporary minimal implementation - will be replaced by full class below
  (globalThis as any).DOMMatrix = class TempDOMMatrix {
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    is2D = true; isIdentity = true;
    constructor() {}
    static fromMatrix(m?: any) { return new (globalThis as any).DOMMatrix(); }
    static fromFloat32Array(a: Float32Array) { return new (globalThis as any).DOMMatrix(); }
    static fromFloat64Array(a: Float64Array) { return new (globalThis as any).DOMMatrix(); }
  };
}

class DOMMatrixPolyfill {
  m11: number; m12: number; m13: number; m14: number;
  m21: number; m22: number; m23: number; m24: number;
  m31: number; m32: number; m33: number; m34: number;
  m41: number; m42: number; m43: number; m44: number;
  is2D: boolean;
  isIdentity: boolean;
  a: number; b: number; c: number; d: number; e: number; f: number;

  constructor(init?: string | number[]) {
    this.m11 = this.a = 1; this.m12 = this.b = 0; this.m13 = 0; this.m14 = 0;
    this.m21 = this.c = 0; this.m22 = this.d = 1; this.m23 = 0; this.m24 = 0;
    this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
    this.m41 = this.e = 0; this.m42 = this.f = 0; this.m43 = 0; this.m44 = 1;
    this.is2D = true;
    this.isIdentity = true;

    if (init) {
      this.isIdentity = false;
      if (typeof init === 'string') {
        const match = init.match(/matrix\(([^)]+)\)/);
        if (match) {
          const values = match[1].split(',').map(parseFloat);
          if (values.length === 6) {
            this.a = this.m11 = values[0]; this.b = this.m12 = values[1]; this.e = this.m41 = values[2];
            this.c = this.m21 = values[3]; this.d = this.m22 = values[4]; this.f = this.m42 = values[5];
            this.is2D = true;
          }
        }
      } else if (Array.isArray(init)) {
        if (init.length === 6) {
          this.a = this.m11 = init[0]; this.b = this.m12 = init[1]; this.e = this.m41 = init[2];
          this.c = this.m21 = init[3]; this.d = this.m22 = init[4]; this.f = this.m42 = init[5];
          this.is2D = true;
        } else if (init.length === 16) {
          this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
          this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
          this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
          this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
          this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22; this.e = this.m41; this.f = this.m42;
          this.is2D = this.m13 === 0 && this.m14 === 0 && this.m23 === 0 && this.m24 === 0 &&
                      this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
                      this.m43 === 0 && this.m44 === 1;
        }
      }
    }
  }

  multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();
    result.m11 = this.m11 * other.m11 + this.m12 * other.m21 + this.m13 * other.m31 + this.m14 * other.m41;
    result.m12 = this.m11 * other.m12 + this.m12 * other.m22 + this.m13 * other.m32 + this.m14 * other.m42;
    result.m13 = this.m11 * other.m13 + this.m12 * other.m23 + this.m13 * other.m33 + this.m14 * other.m43;
    result.m14 = this.m11 * other.m14 + this.m12 * other.m24 + this.m13 * other.m34 + this.m14 * other.m44;
    result.m21 = this.m21 * other.m11 + this.m22 * other.m21 + this.m23 * other.m31 + this.m24 * other.m41;
    result.m22 = this.m21 * other.m12 + this.m22 * other.m22 + this.m23 * other.m32 + this.m24 * other.m42;
    result.m23 = this.m21 * other.m13 + this.m22 * other.m23 + this.m23 * other.m33 + this.m24 * other.m43;
    result.m24 = this.m21 * other.m14 + this.m22 * other.m24 + this.m23 * other.m34 + this.m24 * other.m44;
    result.m31 = this.m31 * other.m11 + this.m32 * other.m21 + this.m33 * other.m31 + this.m34 * other.m41;
    result.m32 = this.m31 * other.m12 + this.m32 * other.m22 + this.m33 * other.m32 + this.m34 * other.m42;
    result.m33 = this.m31 * other.m13 + this.m32 * other.m23 + this.m33 * other.m33 + this.m34 * other.m43;
    result.m34 = this.m31 * other.m14 + this.m32 * other.m24 + this.m33 * other.m34 + this.m34 * other.m44;
    result.m41 = this.m41 * other.m11 + this.m42 * other.m21 + this.m43 * other.m31 + this.m44 * other.m41;
    result.m42 = this.m41 * other.m12 + this.m42 * other.m22 + this.m43 * other.m32 + this.m44 * other.m42;
    result.m43 = this.m41 * other.m13 + this.m42 * other.m23 + this.m43 * other.m33 + this.m44 * other.m43;
    result.m44 = this.m41 * other.m14 + this.m42 * other.m24 + this.m43 * other.m34 + this.m44 * other.m44;
    result.is2D = this.is2D && other.is2D;
    result.isIdentity = false;
    result.a = result.m11; result.b = result.m12; result.c = result.m21; result.d = result.m22; result.e = result.m41; result.f = result.m42;
    return result;
  }

  multiplySelf(other: DOMMatrixPolyfill): this {
    const m = this.multiply(other);
    Object.assign(this, m);
    return this;
  }

  preMultiplySelf(other: DOMMatrixPolyfill): this {
    const m = other.multiply(this);
    Object.assign(this, m);
    return this;
  }

  inverse(): DOMMatrixPolyfill {
    const det = this.m11 * (this.m22 * this.m44 - this.m24 * this.m42) -
                this.m12 * (this.m21 * this.m44 - this.m24 * this.m41) +
                this.m13 * (this.m21 * this.m42 - this.m22 * this.m41) -
                this.m14 * (this.m21 * this.m33 - this.m22 * this.m31);
    if (det === 0) return new DOMMatrixPolyfill();
    const invDet = 1 / det;
    const result = new DOMMatrixPolyfill();
    result.m11 = (this.m22 * this.m44 - this.m24 * this.m42) * invDet;
    result.m12 = (this.m14 * this.m42 - this.m12 * this.m44) * invDet;
    result.m21 = (this.m24 * this.m41 - this.m21 * this.m44) * invDet;
    result.m22 = (this.m11 * this.m44 - this.m14 * this.m41) * invDet;
    result.m41 = (this.m21 * this.m42 - this.m22 * this.m41) * invDet;
    result.m42 = (this.m12 * this.m41 - this.m11 * this.m42) * invDet;
    result.is2D = this.is2D;
    result.isIdentity = false;
    result.a = result.m11; result.b = result.m12; result.c = result.m21; result.d = result.m22; result.e = result.m41; result.f = result.m42;
    return result;
  }

  invertSelf(): this {
    const inv = this.inverse();
    Object.assign(this, inv);
    return this;
  }

  scale(scaleX?: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();
    const sx = scaleX ?? 1;
    const sy = scaleY ?? sx;
    result.m11 = this.m11 * sx; result.m12 = this.m12 * sx;
    result.m21 = this.m21 * sy; result.m22 = this.m22 * sy;
    result.m31 = this.m31; result.m32 = this.m32; result.m33 = this.m33; result.m34 = this.m34;
    result.m41 = this.m41; result.m42 = this.m42; result.m43 = this.m43; result.m44 = this.m44;
    result.a = result.m11; result.b = result.m12; result.c = result.m21; result.d = result.m22; result.e = result.m41; result.f = result.m42;
    return result;
  }

  scaleSelf(scaleX?: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): this {
    const sx = scaleX ?? 1;
    const sy = scaleY ?? sx;
    this.m11 *= sx; this.m12 *= sx;
    this.m21 *= sy; this.m22 *= sy;
    this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22;
    this.isIdentity = false;
    return this;
  }

  scale3d(scale?: number, originX?: number, originY?: number, originZ?: number): DOMMatrixPolyfill {
    return this.scale(scale, scale, scale, originX, originY, originZ);
  }

  scale3dSelf(scale?: number, originX?: number, originY?: number, originZ?: number): this {
    return this.scaleSelf(scale, scale, scale, originX, originY, originZ);
  }

  scaleNonUniform(scaleX?: number, scaleY?: number): DOMMatrixPolyfill {
    return this.scale(scaleX, scaleY);
  }

  rotate(rotX?: number, rotY?: number, rotZ?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill();
  }

  rotateSelf(rotX?: number, rotY?: number, rotZ?: number): this {
    return this;
  }

  rotateAxisAngle(x?: number, y?: number, z?: number, angle?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill();
  }

  rotateAxisAngleSelf(x?: number, y?: number, z?: number, angle?: number): this {
    return this;
  }

  rotateFromVector(x?: number, y?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill();
  }

  rotateFromVectorSelf(x?: number, y?: number): this {
    return this;
  }

  translate(tx?: number, ty?: number, tz?: number): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();
    Object.assign(result, this);
    result.m41 = this.m41 + (tx ?? 0);
    result.m42 = this.m42 + (ty ?? 0);
    result.m43 = this.m43 + (tz ?? 0);
    result.e = result.m41; result.f = result.m42;
    return result;
  }

  translateSelf(tx?: number, ty?: number, tz?: number): this {
    this.m41 += tx ?? 0;
    this.m42 += ty ?? 0;
    this.m43 += tz ?? 0;
    this.e = this.m41; this.f = this.m42;
    this.isIdentity = false;
    return this;
  }

  skewX(sx?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill();
  }

  skewXSelf(sx?: number): this {
    return this;
  }

  skewY(sy?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill();
  }

  skewYSelf(sy?: number): this {
    return this;
  }

  flipX(): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();
    Object.assign(result, this);
    result.m11 = -this.m11; result.m12 = -this.m12;
    result.a = result.m11; result.b = result.m12;
    return result;
  }

  flipY(): DOMMatrixPolyfill {
    const result = new DOMMatrixPolyfill();
    Object.assign(result, this);
    result.m21 = -this.m21; result.m22 = -this.m22;
    result.c = result.m21; result.d = result.m22;
    return result;
  }

  setMatrixValue(transformList: string): this {
    return this;
  }

  transformPoint(point?: DOMPointInit): DOMPoint {
    const x = point?.x ?? 0;
    const y = point?.y ?? 0;
    const z = point?.z ?? 0;
    const w = point?.w ?? 1;
    const result = {
      x: this.m11 * x + this.m21 * y + this.m31 * z + this.m41 * w,
      y: this.m12 * x + this.m22 * y + this.m32 * z + this.m42 * w,
      z: this.m13 * x + this.m23 * y + this.m33 * z + this.m43 * w,
      w: this.m14 * x + this.m24 * y + this.m34 * z + this.m44 * w,
      toJSON() { return { x: this.x, y: this.y, z: this.z, w: this.w }; },
      matrixTransform(matrix?: DOMMatrixInit): DOMPoint { return this as any; }
    };
    return result as DOMPoint;
  }

  toFloat32Array(): Float32Array {
    return new Float32Array([
      this.m11, this.m12, this.m13, this.m14,
      this.m21, this.m22, this.m23, this.m24,
      this.m31, this.m32, this.m33, this.m34,
      this.m41, this.m42, this.m43, this.m44
    ]);
  }

  toFloat64Array(): Float64Array {
    return new Float64Array([
      this.m11, this.m12, this.m13, this.m14,
      this.m21, this.m22, this.m23, this.m24,
      this.m31, this.m32, this.m33, this.m34,
      this.m41, this.m42, this.m43, this.m44
    ]);
  }

  toJSON() {
    return {
      a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f,
      m11: this.m11, m12: this.m12, m13: this.m13, m14: this.m14,
      m21: this.m21, m22: this.m22, m23: this.m23, m24: this.m24,
      m31: this.m31, m32: this.m32, m33: this.m33, m34: this.m34,
      m41: this.m41, m42: this.m42, m43: this.m43, m44: this.m44,
      is2D: this.is2D, isIdentity: this.isIdentity
    };
  }

  toString(): string {
    if (this.is2D) {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
    return `matrix3d(${this.m11}, ${this.m12}, ${this.m13}, ${this.m14}, ${this.m21}, ${this.m22}, ${this.m23}, ${this.m24}, ${this.m31}, ${this.m32}, ${this.m33}, ${this.m34}, ${this.m41}, ${this.m42}, ${this.m43}, ${this.m44})`;
  }

  static fromFloat32Array(array32: Float32Array): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(Array.from(array32));
  }

  static fromFloat64Array(array64: Float64Array): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(Array.from(array64));
  }

  static fromMatrix(other?: DOMMatrixInit): DOMMatrixPolyfill {
    if (!other) return new DOMMatrixPolyfill();
    const matrix = new DOMMatrixPolyfill();
    if ('m11' in other) {
      matrix.m11 = other.m11 ?? 1; matrix.m12 = other.m12 ?? 0; matrix.m13 = other.m13 ?? 0; matrix.m14 = other.m14 ?? 0;
      matrix.m21 = other.m21 ?? 0; matrix.m22 = other.m22 ?? 1; matrix.m23 = other.m23 ?? 0; matrix.m24 = other.m24 ?? 0;
      matrix.m31 = other.m31 ?? 0; matrix.m32 = other.m32 ?? 0; matrix.m33 = other.m33 ?? 1; matrix.m34 = other.m34 ?? 0;
      matrix.m41 = other.m41 ?? 0; matrix.m42 = other.m42 ?? 0; matrix.m43 = other.m43 ?? 0; matrix.m44 = other.m44 ?? 1;
    }
    if ('a' in other) {
      matrix.a = other.a ?? 1; matrix.b = other.b ?? 0; matrix.c = other.c ?? 0;
      matrix.d = other.d ?? 1; matrix.e = other.e ?? 0; matrix.f = other.f ?? 0;
    }
    matrix.is2D = other.is2D ?? true;
    return matrix;
  }
}

// Replace the temporary placeholder with the full implementation
if (typeof globalThis !== 'undefined') {
  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
}

export { DOMMatrixPolyfill as DOMMatrix };
