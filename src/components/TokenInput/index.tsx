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

  const [customGiffAmount, setCustomGiffAmount] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  const { address } = useAccount();
  const {
    setLusdPrice,
    lusdBalance,
    setLusdBalance,
    setStayBullPrice,
    setPlsPrice,
    setLusdAmount,
    setStayBullAmount,
    setLusdPLSPrice,
    lusdPriceInUSD,
    stayBullPriceInUSD,
    lusdAmountInteger
  } = useTokenContext();

  useEffect(() => {
    setCustomGiffAmount(Number(lusdAmountInteger.toFixed(5)).toString());
  }, [lusdAmountInteger]);

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
    if (tokenType === TokenTypes.LUSD) {
      setLusdBalance(balance as BigInt);
    }
  }, [balance, setLusdBalance, tokenType]);

  const fetcher = <T,>(...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json() as Promise<T>);
  const { data, isLoading, isValidating } = useSWR(api, fetcher, {
    refreshInterval: 5000
  });

  useEffect(() => {
    const tokenData: PairsResponse | undefined = data as PairsResponse;

    if (tokenData && typeof tokenData === 'object' && 'pairs' in tokenData) {
      const pairData = tokenData.pairs?.[0] || {};

      tokenType === TokenTypes.LUSD && setLusdPLSPrice(pairData?.priceNative || '0');
      (tokenType === TokenTypes.LUSD ? setLusdPrice : setStayBullPrice)(pairData?.priceUsd || '0');
    }
  }, [data, setLusdPrice, setStayBullPrice, setPlsPrice, setLusdPLSPrice, tokenType]);

  const tokenPrice = useMemo(() => {
    return tokenType === TokenTypes.LUSD ? lusdPriceInUSD : stayBullPriceInUSD;
  }, [lusdPriceInUSD, stayBullPriceInUSD, tokenType]);

  const balanceInteger = useMemo(() => {
    const tokenBalance = tokenType === TokenTypes.LUSD ? lusdBalance : balance;
    return parseFloat(tokenBalance?.toString() || '0n') / 10 ** DEFAULT_DECIMALS;
  }, [balance, lusdBalance, tokenType]);

  const handleBlur: FocusEventHandler = useCallback(
    (e) => {
      if (!customGiffAmount) {
        setCustomGiffAmount('0');
      }
    },
    [customGiffAmount]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);

      if (isNaN(value) || value === 0) {
        setCustomGiffAmount(isNaN(value) ? '' : '0');
        (tokenType === TokenTypes.LUSD ? setLusdAmount : setStayBullAmount)(0n);
      } else {
        (tokenType === TokenTypes.LUSD ? setLusdAmount : setStayBullAmount)(
          BigInt(value * 10 ** 18)
        );
      }
    },
    [setLusdAmount, setStayBullAmount, tokenType]
  );

  const handleClickMax = useCallback(() => {
    setLusdAmount(lusdBalance);
  }, [lusdBalance, setLusdAmount]);

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
              'text-theme': tokenType === TokenTypes.LUSD,
              'text-secondary': tokenType === TokenTypes.STAY_BULL
            })}
          >
            {label}
          </span>
          <input
            name={label}
            type="number"
            ref={inputRef}
            className={clsx('w-full bg-transparent text-4xl font-bold outline-none', {
              'cursor-default': tokenType !== TokenTypes.LUSD
            })}
            readOnly={tokenType !== TokenTypes.LUSD}
            defaultValue={customGiffAmount}
            value={tokenType === TokenTypes.LUSD ? customGiffAmount : customGiffAmount || '0'}
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
            className="h-8 w-8 cursor-pointer"
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
          {tokenType === TokenTypes.LUSD && (
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
