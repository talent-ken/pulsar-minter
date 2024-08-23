export enum TokenTypes {
  TITANX = 'eTITANX',
  PULSAR = 'PULSAR',
  ETH = 'ETH'
}

export type PairsResponse = {
  schemaVersion: string;
  pairs: any[] | null;
};
