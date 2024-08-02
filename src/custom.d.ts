// In a type declaration file (e.g., global.d.ts) or at the top of your TypeScript file

interface Ethereum {
  isMetaMask?: true;
  request: ({
    method,
    params
  }: {
    method: string;
    params?: {
      type: string;
      options: {
        address: `0x${string}` | undefined;
        symbol: string;
        decimals: number;
        image: string | undefined;
      };
    };
  }) => Promise<any>;
}

// Extends the Window interface to include 'ethereum'
interface Window {
  ethereum?: Ethereum;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
