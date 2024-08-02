export enum TokenTypes {
  LUSD = 'LUSD',
  STAY_BULL = 'sBULL',
  PLS = 'PLS'
}

export type PairsResponse = {
  schemaVersion: string;
  pairs: any[] | null;
};
