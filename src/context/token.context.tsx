import { createContext, ReactNode, useContext, useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import BigNumber from 'bignumber.js';

import { PairsResponse } from 'constants/constants';

interface ITokenContext {
  titanXAmount: bigint;
  setTitanXAmount: (amount: bigint) => void;
  titanXBalance: bigint;
  setTitanXBalance: (balance: bigint) => void;
  pulsarAmount: bigint;
  setPulsarAmount: (amount: bigint) => void;
  wEthPrice: string;
  setWEthPrice: (price: string) => void;
  titanXPrice: string;
  setTitanXPrice: (price: string) => void;
  pulsarPrice: string;
  setPulsarPrice: (price: string) => void;
  titanXWEthPrice: string;
  setTitanXWEthPrice: (price: string) => void;
  titanXPriceInUSD: number;
  pulsarPriceInUSD: number;
  wEthPriceInUSD: number;
  titanXAmountInteger: number;
  wEthValue: string;
  wEthAmount: bigint;
  priceDenominator: string;
}

export const TokenContext = createContext<ITokenContext>({} as ITokenContext);

export const DEFAULT_DECIMALS = 18;

interface ITokenContextProvider {
  children: ReactNode;
}

export const TokenContextProvider = (props: ITokenContextProvider) => {
  const { children } = props;

  const [titanXAmount, setTitanXAmount] = useState<bigint>(0n);
  const [titanXBalance, setTitanXBalance] = useState<bigint>(0n);
  const [pulsarAmount, setPulsarAmount] = useState<bigint>(0n);
  const [titanXPrice, setTitanXPrice] = useState<string>('0');
  const [pulsarPrice, setPulsarPrice] = useState<string>('0');
  const [wEthPrice, setWEthPrice] = useState<string>('0');
  const [titanXWEthPrice, setTitanXWEthPrice] = useState<string>('0');
  const [priceDenominator, setPriceDenominator] = useState<string>('0');

  console.log({ priceDenominator });

  const api =
    'https://api.dexscreener.com/latest/dex/pairs/ethereum/0xc45a81bc23a64ea556ab4cdf08a86b61cdceea8b';

  const fetcher = <T,>(...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json() as Promise<T>);
  const { data } = useSWR(api, fetcher);

  useEffect(() => {
    const tokenData: PairsResponse | undefined = data as PairsResponse;
    if (tokenData && typeof tokenData === 'object' && 'pairs' in tokenData) {
      const pairData = tokenData.pairs?.[0] || {};
      const priceNative = pairData.priceNative;
      const priceDenom = (1 / priceNative).toFixed(0);

      setPriceDenominator(priceDenom);
    }
  }, [data, setWEthPrice]);

  const titanXAmountInteger = useMemo(
    () => parseFloat(titanXAmount.toString()) / 10 ** DEFAULT_DECIMALS,
    [titanXAmount]
  );
  const wEthAmount = useMemo(() => {
    if (priceDenominator === '0') return 0n;
    return titanXAmount / BigInt(priceDenominator);
  }, [priceDenominator, titanXAmount]);

  const titanXPriceInUSD = useMemo(
    () => parseFloat(titanXPrice) * (parseFloat(titanXAmount.toString()) / 10 ** DEFAULT_DECIMALS),
    [titanXPrice, titanXAmount]
  );
  const pulsarPriceInUSD = useMemo(
    () => parseFloat(pulsarPrice) * (parseFloat(titanXAmount.toString()) / 10 ** DEFAULT_DECIMALS),
    [pulsarPrice, titanXAmount]
  );

  const wEthValue = useMemo(
    () => BigNumber(wEthAmount.toString()).div(1e18).toFixed(3),
    [wEthAmount]
  );

  const wEthPriceInUSD = useMemo(
    () => parseFloat(wEthPrice) * parseFloat(wEthValue),
    [wEthPrice, wEthValue]
  );

  const value: ITokenContext = useMemo(
    () => ({
      titanXAmount,
      setTitanXAmount,
      titanXBalance,
      setTitanXBalance,
      pulsarAmount,
      setPulsarAmount,
      wEthPrice,
      setWEthPrice,
      titanXPrice,
      setTitanXPrice,
      pulsarPrice,
      setPulsarPrice,
      titanXWEthPrice,
      setTitanXWEthPrice,
      titanXPriceInUSD,
      pulsarPriceInUSD,
      wEthPriceInUSD,
      titanXAmountInteger,
      wEthValue,
      wEthAmount,
      priceDenominator
    }),
    [
      titanXAmount,
      titanXBalance,
      pulsarAmount,
      wEthPrice,
      titanXPrice,
      pulsarPrice,
      titanXWEthPrice,
      titanXPriceInUSD,
      pulsarPriceInUSD,
      wEthPriceInUSD,
      titanXAmountInteger,
      wEthValue,
      wEthAmount,
      priceDenominator
    ]
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

export const useTokenContext = () => useContext(TokenContext);
