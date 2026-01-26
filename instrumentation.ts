// Next.js instrumentation hook - runs at app startup before any routes
// This ensures DOMMatrix polyfill is loaded before pdfjs-dist

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Set up DOMMatrix polyfill IMMEDIATELY
    if (typeof globalThis.DOMMatrix === 'undefined') {
      console.log('[Instrumentation] Setting up DOMMatrix polyfill...');

      (globalThis as any).DOMMatrix = class DOMMatrix {
        m11 = 1; m12 = 0; m13 = 0; m14 = 0;
        m21 = 0; m22 = 1; m23 = 0; m24 = 0;
        m31 = 0; m32 = 0; m33 = 1; m34 = 0;
        m41 = 0; m42 = 0; m43 = 0; m44 = 1;
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        is2D = true;
        isIdentity = true;

        constructor(init?: string | number[]) {
          if (init) {
            this.isIdentity = false;
            if (Array.isArray(init)) {
              if (init.length === 6) {
                this.a = this.m11 = init[0];
                this.b = this.m12 = init[1];
                this.c = this.m21 = init[2];
                this.d = this.m22 = init[3];
                this.e = this.m41 = init[4];
                this.f = this.m42 = init[5];
              } else if (init.length === 16) {
                this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3];
                this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7];
                this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11];
                this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15];
                this.a = this.m11; this.b = this.m12; this.c = this.m21; this.d = this.m22;
                this.e = this.m41; this.f = this.m42;
              }
            }
          }
        }

        multiply(other: any) { return new (globalThis as any).DOMMatrix(); }
        inverse() { return new (globalThis as any).DOMMatrix(); }
        translate(tx?: number, ty?: number) { return new (globalThis as any).DOMMatrix(); }
        scale(sx?: number, sy?: number) { return new (globalThis as any).DOMMatrix(); }
        transformPoint(point?: any) { return { x: 0, y: 0, z: 0, w: 1 }; }
        toFloat32Array() { return new Float32Array(16); }
        toFloat64Array() { return new Float64Array(16); }

        static fromMatrix(m?: any) { return new (globalThis as any).DOMMatrix(); }
        static fromFloat32Array(a: Float32Array) { return new (globalThis as any).DOMMatrix(Array.from(a)); }
        static fromFloat64Array(a: Float64Array) { return new (globalThis as any).DOMMatrix(Array.from(a)); }
      };

      console.log('[Instrumentation] DOMMatrix polyfill installed');
    }
  }
}
