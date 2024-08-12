import { FocusEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useSWR from 'swr';
import clsx from 'clsx';
import { useAccount, useReadContract } from 'wagmi';
import { Setting2 } from 'iconic-react';

import { DEFAULT_DECIMALS, useTokenContext } from 'context/token.context';

import { TokenTypes, PairsResponse } from 'constants/constants';
import { showNotification } from 'libs/libs';

interface ITokenInput {
  tokenType: TokenTypes;
  classNames?: string;
  tokenImage?: string;
  abi?: any;
  api: string;
  label: string;
  contractAddress?: `0x${string}`;
  tokenImageUrl: string;
}

export const FALLBACK_ADDRESS = '0x0000000000000000000000000000000000000000';

const TokenInput = (props: ITokenInput) => {
  const { tokenType, classNames, tokenImage, abi, api, label, contractAddress, tokenImageUrl } =
    props;

  const [defaultPulsarAmount, setDefaultPulsarAmount] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const { address } = useAccount();
  const {
    setTitanXPrice,
    titanXBalance,
    setTitanXBalance,
    setPulsarPrice,
    setWEthPrice,
    setTitanXAmount,
    setPulsarAmount,
    setTitanXWEthPrice,
    titanXPriceInUSD,
    pulsarPriceInUSD,
    titanXAmountInteger
  } = useTokenContext();

  useEffect(() => {
    setDefaultPulsarAmount(Number(titanXAmountInteger.toFixed(5)).toString());
  }, [titanXAmountInteger]);

  const {
    data: balance,
    isPending,
    refetch
  } = useReadContract({
    address: contractAddress,
    abi: abi || [],
    functionName: 'balanceOf',
    args: [address || FALLBACK_ADDRESS]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (tokenType === TokenTypes.TITANX) {
      setTitanXBalance(balance as bigint);
    }
  }, [balance, setTitanXBalance, tokenType]);

  const fetcher = <T,>(...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json() as Promise<T>);
  const { data, isLoading, isValidating } = useSWR(api, fetcher, {
    refreshInterval: 5000
  });

  useEffect(() => {
    const tokenData: PairsResponse | undefined = data as PairsResponse;

    if (tokenData && typeof tokenData === 'object' && 'pairs' in tokenData) {
      const pairData = tokenData.pairs?.[0] || {};

      tokenType === TokenTypes.TITANX && setTitanXWEthPrice(pairData?.priceNative || '0');
      (tokenType === TokenTypes.TITANX ? setTitanXPrice : setPulsarPrice)(
        pairData?.priceUsd || '0'
      );
    }
  }, [data, setTitanXPrice, setPulsarPrice, setWEthPrice, setTitanXWEthPrice, tokenType]);

  const tokenPrice = useMemo(() => {
    return tokenType === TokenTypes.TITANX ? titanXPriceInUSD : pulsarPriceInUSD;
  }, [titanXPriceInUSD, pulsarPriceInUSD, tokenType]);

  const balanceInteger = useMemo(() => {
    const tokenBalance = tokenType === TokenTypes.TITANX ? titanXBalance : balance;
    return parseFloat(tokenBalance?.toString() || '0n') / 10 ** DEFAULT_DECIMALS;
  }, [balance, titanXBalance, tokenType]);

  const handleBlur: FocusEventHandler = useCallback(
    (e) => {
      if (!defaultPulsarAmount) {
        setDefaultPulsarAmount('0');
      }
    },
    [defaultPulsarAmount]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);

      if (isNaN(value) || value === 0) {
        setDefaultPulsarAmount(isNaN(value) ? '' : '0');
        (tokenType === TokenTypes.TITANX ? setTitanXAmount : setPulsarAmount)(0n);
      } else {
        (tokenType === TokenTypes.TITANX ? setTitanXAmount : setPulsarAmount)(
          BigInt(value * 10 ** 18)
        );
      }
    },
    [setTitanXAmount, setPulsarAmount, tokenType]
  );

  const handleClickMax = useCallback(() => {
    setTitanXAmount(titanXBalance);
  }, [titanXBalance, setTitanXAmount]);

  const addTokenToMetamask = useCallback(
    async (
      address: `0x${string}` | undefined,
      symbol: TokenTypes,
      decimals: number,
      image: string | undefined
    ) => {
      try {
        if (window.ethereum) {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address,
                symbol,
                decimals,
                image
              }
            }
          });

          if (wasAdded) {
            showNotification('Token added to Metamask', 'success');
          } else {
            showNotification('Token not added to Metamask', 'error');
          }
        } else {
          showNotification('Please install Metamask extension', 'error');
        }
      } catch (error) {
        showNotification("Can't add token to Metamask", 'error');
      }
    },
    []
  );

  return (
    <div className={clsx('flex w-full flex-col bg-gray-900/40 p-2 backdrop-blur-lg', classNames)}>
      <div className="flex items-center justify-between gap-x-10">
        <label htmlFor={label} className="flex w-full flex-col gap-y-1 text-gray-300">
          <span
            className={clsx('font-bold', {
              'text-theme': tokenType === TokenTypes.TITANX,
              'text-secondary': tokenType === TokenTypes.PULSAR
            })}
          >
            {label}
          </span>
          <input
            name={label}
            type="number"
            ref={inputRef}
            className={clsx('w-full bg-transparent text-4xl font-bold outline-none', {
              'cursor-default': tokenType !== TokenTypes.TITANX
            })}
            readOnly={tokenType !== TokenTypes.TITANX}
            defaultValue={defaultPulsarAmount}
            value={
              tokenType === TokenTypes.TITANX
                ? defaultPulsarAmount
                : Number(defaultPulsarAmount) / 4 || '0'
            }
            onBlur={handleBlur}
            min={0}
            onChange={handleInputChange}
          />
        </label>
        {Boolean(tokenImage) && (
          <img
            src={tokenImage}
            title="Add token to the Metamask"
            alt="token logo"
            className="h-8 w-8 cursor-pointer rounded-full"
            onClick={() =>
              addTokenToMetamask(contractAddress, tokenType, DEFAULT_DECIMALS, tokenImageUrl)
            }
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-400">
          {isLoading || isValidating ? (
            <Setting2 size={16} variant="Outline" className="animate-spin" />
          ) : (
            <div>{`$ ${Number(tokenPrice.toFixed(3)).toLocaleString('en')}`}</div>
          )}
        </div>
        <div className="flex items-center gap-x-2 text-gray-400">
          {isPending ? (
            <Setting2 size={16} variant="Outline" className="animate-spin" />
          ) : (
            <span className="text-sm font-semibold">Balance {balanceInteger.toFixed(1)}</span>
          )}
          {tokenType === TokenTypes.TITANX && (
            <button
              type="button"
              className="rounded bg-theme px-2 py-0.5 text-xs font-semibold text-gray-800"
              onClick={handleClickMax}
            >
              Max
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenInput;
