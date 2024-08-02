import { createContext, ReactNode, useContext, useState, useMemo } from 'react';

interface ITokenContext {
  lusdAmount: BigInt;
  setLusdAmount: (amount: BigInt) => void;
  lusdBalance: BigInt;
  setLusdBalance: (balance: BigInt) => void;
  stayBullAmount: BigInt;
  setStayBullAmount: (amount: BigInt) => void;
  plsPrice: string;
  setPlsPrice: (price: string) => void;
  lusdPrice: string;
  setLusdPrice: (price: string) => void;
  stayBullPrice: string;
  setStayBullPrice: (price: string) => void;
  lusdPLSPrice: string;
  setLusdPLSPrice: (price: string) => void;
  lusdPriceInUSD: number;
  stayBullPriceInUSD: number;
  plsPriceInUSD: number;
  lusdAmountInteger: number;
  plsAmountInteger: number;
}

export const TokenContext = createContext<ITokenContext>({} as ITokenContext);

export const DEFAULT_DECIMALS = 18;

interface ITokenContextProvider {
  children: ReactNode;
}

export const TokenContextProvider = (props: ITokenContextProvider) => {
  const { children } = props;

  const [lusdAmount, setLusdAmount] = useState<BigInt>(0n);
  const [lusdBalance, setLusdBalance] = useState<BigInt>(0n);
  const [stayBullAmount, setStayBullAmount] = useState<BigInt>(0n);
  const [plsPrice, setPlsPrice] = useState<string>('0');
  const [lusdPrice, setLusdPrice] = useState<string>('0');
  const [stayBullPrice, setStayBullPrice] = useState<string>('0');
  const [lusdPLSPrice, setLusdPLSPrice] = useState<string>('0');

  const lusdAmountInteger = useMemo(
    () => parseFloat(lusdAmount.toString()) / 10 ** DEFAULT_DECIMALS,
    [lusdAmount]
  );
  const plsAmountInteger = useMemo(
    () => (lusdAmountInteger * parseFloat(lusdPLSPrice) * 101) / 100,
    [lusdAmountInteger, lusdPLSPrice]
  );

  const lusdPriceInUSD = useMemo(
    () => parseFloat(lusdPrice) * (parseFloat(lusdAmount.toString()) / 10 ** DEFAULT_DECIMALS),
    [lusdPrice, lusdAmount]
  );
  const stayBullPriceInUSD = useMemo(
    () => parseFloat(stayBullPrice) * (parseFloat(lusdAmount.toString()) / 10 ** DEFAULT_DECIMALS),
    [stayBullPrice, lusdAmount]
  );
  const plsPriceInUSD = useMemo(
    () => parseFloat(plsPrice) * plsAmountInteger,
    [plsPrice, plsAmountInteger]
  );

  const value: ITokenContext = useMemo(
    () => ({
      lusdAmount,
      setLusdAmount,
      lusdBalance,
      setLusdBalance,
      stayBullAmount,
      setStayBullAmount,
      plsPrice,
      setPlsPrice,
      lusdPrice,
      setLusdPrice,
      stayBullPrice,
      setStayBullPrice,
      lusdPLSPrice,
      setLusdPLSPrice,
      lusdPriceInUSD,
      stayBullPriceInUSD,
      plsPriceInUSD,
      lusdAmountInteger,
      plsAmountInteger
    }),
    [
      lusdAmount,
      lusdAmountInteger,
      lusdBalance,
      lusdPLSPrice,
      lusdPrice,
      lusdPriceInUSD,
      plsAmountInteger,
      plsPrice,
      plsPriceInUSD,
      stayBullAmount,
      stayBullPrice,
      stayBullPriceInUSD
    ]
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

export const useTokenContext = () => useContext(TokenContext);
