export enum TokenTypes {
  TITANX = 'TITANX',
  PULSAR = 'PULSAR',
  ETH = 'ETH'
}

export type PairsResponse = {
  schemaVersion: string;
  pairs: any[] | null;
};
