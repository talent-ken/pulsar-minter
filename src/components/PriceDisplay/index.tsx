import { useEffect } from 'react';

import useSWR from 'swr';
import { Setting2 } from 'iconic-react';

import { useTokenContext } from 'context/token.context';

import { PairsResponse } from 'constants/constants';

interface IPriceDisplay {
  title: string;
  currency?: '$';
  api: string;
}

const PriceDisplay = (props: IPriceDisplay) => {
  const { title, currency = '$', api } = props;

  const { setWEthPrice, wEthPriceInUSD } = useTokenContext();

  const fetcher = <T,>(...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json() as Promise<T>);
  const { data, isLoading, isValidating } = useSWR(api, fetcher);

  useEffect(() => {
    const tokenData: PairsResponse | undefined = data as PairsResponse;
    if (tokenData && typeof tokenData === 'object' && 'pairs' in tokenData) {
      const pairData = tokenData.pairs?.[0] || {};

      setWEthPrice(pairData?.priceUsd || '0');
    }
  }, [data, setWEthPrice]);

  return (
    <div className="flex w-full items-center justify-between text-sm font-bold text-gray-300">
      <div className="flex items-center gap-x-2">Value in {title}:</div>
      {isLoading || isValidating ? (
        <Setting2 size={16} variant="Outline" className="animate-spin" />
      ) : (
        `${currency}${Number(wEthPriceInUSD.toFixed(3)).toLocaleString('us')}`
      )}
    </div>
  );
};

export default PriceDisplay;
