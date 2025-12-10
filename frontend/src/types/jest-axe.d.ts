// Declaração de tipos para jest-axe
declare module 'jest-axe' {
  import { AxeResults } from 'axe-core';
  
  export function axe(html: Element | string): Promise<AxeResults>;
  export function toHaveNoViolations(results: AxeResults): { pass: boolean; message: () => string };
  
  export const configureAxe: (options?: object) => typeof axe;
}

// Estender matchers do Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

export {};
