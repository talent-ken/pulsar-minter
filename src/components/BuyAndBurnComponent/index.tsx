import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useBalance,
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { pulsechain } from 'wagmi/chains';
import { Setting2 } from 'iconic-react';
import { ethers } from 'ethers';

import { DEFAULT_DECIMALS } from 'context/token.context';

import { bnbAbi, pulsarAbi, titanxAbi } from 'constants/abi';
import { createNonce, showNotification } from 'libs/libs';

const FUNC_SELECTOR = '8218b58f';

const ethProvider = ethers.getDefaultProvider('sepolia');

const BuyAndBurnComponent = () => {
  const [stepStatus, setStepStatus] = useState('');
  const [bnbValue, setBnbValue] = useState<string>('0');

  const { address } = useAccount();

  const { data: hash, writeContract, status } = useWriteContract();
  const { isLoading } = useWaitForTransactionReceipt({ hash });

  const { data: balance, refetch: refetchPLSBalance } = useBalance({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`
  });
  const { formatted: balanceFormatted, symbol: balanceSymbol } = useMemo(() => {
    if (!balance) return { formatted: '0', symbol: 'ETH' };

    const balanceValue = balance.value;
    const balanceDivisor = BigInt(10 ** balance.decimals);

    const balanceInteger = balanceValue / balanceDivisor;
    const remainderPart = (balanceValue % balanceDivisor)
      .toString()
      .padStart(balance.decimals, '0');
    const formatted = parseFloat(`${balanceInteger.toString()}.${remainderPart}`).toFixed(3);

    const symbol = balance?.symbol || 'ETH';

    return { formatted, symbol };
  }, [balance]);

  const { data: lastActionTs, refetch: refetchLastAction } = useReadContract({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
    abi: bnbAbi,
    functionName: 'lastBurnTime',
    args: []
  });

  const { data: bnbInterval, refetch: refetchBnbInterval } = useReadContract({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
    abi: bnbAbi,
    functionName: 'burnInterval',
    args: []
  });

  const { data: totalIBurnSupply, refetch: refetchSupplyInterval } = useReadContract({
    address: process.env.REACT_APP_TITANX_CONTRACT_ADDRESS as `0x${string}`,
    abi: titanxAbi,
    functionName: 'balanceOf',
    args: [process.env.REACT_APP_BNB_CONTRACT_ADDRESS]
  });

  const decodeEvent = useCallback((event: any) => {
    const iface = new ethers.Interface(bnbAbi);
    const decodedEvents = iface.decodeEventLog('CommitBurn', event.data, event.topics);
    return decodedEvents.getValue('pulsarAmountBurned');
  }, []);

  const getBnBValue = useCallback(async () => {
    try {
      const contract = new ethers.Contract(
        process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
        bnbAbi,
        ethProvider
      );

      const filter = contract.filters.CommitBurn();
      const bnbEvents = await contract.queryFilter(filter);

      console.log({ bnbEvents });

      let total = BigInt(0);
      bnbEvents.forEach((event) => {
        const decodedEvent = decodeEvent(event);
        total += BigInt(decodedEvent);
      });

      return (total / BigInt(10 ** DEFAULT_DECIMALS)).toLocaleString('us');
    } catch (err) {
      console.error({ err });
      return '0';
    }
  }, [decodeEvent]);

  useEffect(() => {
    getBnBValue().then((value) => setBnbValue(value));

    const burntCountInterval = setInterval(() => {
      getBnBValue().then((value) => setBnbValue(value));
      refetchSupplyInterval();
    }, 60000);

    return () => {
      clearInterval(burntCountInterval);
    };
  }, [getBnBValue, refetchSupplyInterval]);

  useEffect(() => {
    const settingInterval = setInterval(() => {
      refetchPLSBalance();
    }, 10000);

    const permissionInterval = setInterval(() => {
      refetchLastAction();
      refetchBnbInterval();
    }, 5000);

    return () => {
      clearInterval(settingInterval);
      clearInterval(permissionInterval);
    };
  }, [refetchBnbInterval, refetchLastAction, refetchPLSBalance]);

  const getIntValue = useCallback((value: BigInt) => {
    return parseInt(value.toString());
  }, []);

  const sanitizeCalladata = useCallback((calldata: any) => calldata.replace(FUNC_SELECTOR, ''), []);

  const fetchQuoteFromPiteas = useCallback(
    async (amount: BigInt, slippage = 3.0) => {
      setStepStatus('Fetching quote from Piteas...');

      const url = `https://sdk.piteas.io/quote?tokenInAddress=PLS&tokenOutAddress=${process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS}&amount=${amount}&allowedSlippage=${slippage}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Referer: 'giffordwear.win'
          }
        });
        const data = await response.json();

        const callData = sanitizeCalladata(data.methodParameters.calldata);

        return callData;
      } catch (error) {
        setStepStatus('');
        showNotification('Error fetching quote from Piteas', 'error');
      }
    },
    [sanitizeCalladata]
  );

  useEffect(() => {
    if (isLoading === false && status === 'success') {
      setStepStatus('');
      showNotification('Transaction successful', 'success');
    }

    if (status === 'error') {
      setStepStatus('');
      showNotification('Transaction happens too frequently.', 'error');
    }

    if (status === 'pending') {
      setStepStatus('Waiting for Buy and Burn execution...');
    }
  }, [isLoading, status]);

  const fetchSignedMessage = useCallback(
    async (
      contractAddr: `0x${string}`,
      walletAddr: `0x${string}`,
      amount: BigInt,
      nonce: string,
      chainId: number
    ) => {
      setStepStatus('Fetching signed message from GiffordOA...');
      const url = 'https://verify.giffordwear.win/api';
      const requestBody = {
        message: {
          contractAddr,
          walletAddr,
          amount: amount.toString(),
          nonce,
          chainId
        }
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        const data = await response.json();

        return data.payload;
      } catch (error) {
        setStepStatus('');
        showNotification('Error fetching signed message', 'error');
      }
    },
    []
  );

  const handleExecuteBandB = useCallback(async () => {
    const swapAmount = BigInt(parseFloat(process.env.REACT_APP_SWAP_AMOUNT || '0.0') * 1e18);

    if (!balance || !bnbInterval || !lastActionTs || !swapAmount) {
      showNotification('Please wait until the data is loaded', 'info');
      return;
    }

    if ((swapAmount as BigInt) > (balance?.value as BigInt)) {
      showNotification('Insufficient BNB PLS balance', 'error');
      return;
    }

    const currentTime = new Date();
    if (
      currentTime.getTime() - getIntValue(lastActionTs as BigInt) * 1000 <
      getIntValue(bnbInterval as BigInt) * 1000
    ) {
      showNotification('Please wait for the next interval', 'error');
      return;
    }

    const callData = await fetchQuoteFromPiteas(swapAmount as BigInt);
    if (!callData) return;

    const nonce = createNonce();
    const signedMessage = await fetchSignedMessage(
      process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
      address as `0x${string}`,
      swapAmount,
      nonce + '',
      pulsechain.id
    );
    if (!signedMessage) return;

    try {
      writeContract({
        address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
        abi: bnbAbi || [],
        functionName: 'exec',
        args: [callData, nonce, signedMessage]
      });
    } catch (error) {
      setStepStatus('');
      showNotification('Transaction Reverted...', 'error');
    }
  }, [
    address,
    balance,
    bnbInterval,
    fetchQuoteFromPiteas,
    fetchSignedMessage,
    getIntValue,
    lastActionTs,
    writeContract
  ]);

  const formatMinutes = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes} min${remainingSeconds ? ` ${remainingSeconds} sec` : ''}`;
  }, []);

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-xl border-2 border-secondary bg-gray-700/50 px-4 py-6 shadow-2xl backdrop-blur-3xl md:w-130">
      <div className="flex flex-col gap-y-4">
        <h3 className="border-b-2 border-secondary pb-4 text-center text-2xl font-bold text-gray-100 md:text-3xl">
          Current Statistics
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">TITANX Total Supply:</span>
          <span className="font-bold">
            {totalIBurnSupply
              ? `${(BigInt(totalIBurnSupply as string) / BigInt(10 ** DEFAULT_DECIMALS)).toLocaleString('us')} PULSAR`
              : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">PULSAR Burnt Supply:</span>
          <span className="font-bold">{`${bnbValue} PULSAR`}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">BuyAndBurn ETH:</span>
          <span className="font-bold">
            {balanceFormatted ? `${balanceFormatted} ${balanceSymbol}` : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">Last BuyAndBurn:</span>
          <span className="font-bold">
            {lastActionTs
              ? new Date(getIntValue(lastActionTs as BigInt) * 1000).toUTCString()
              : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">BuyAndBurn Interval:</span>
          <span className="font-bold">
            {bnbInterval ? formatMinutes(parseInt((bnbInterval as BigInt).toString())) : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold">Swap Amount:</span>
          <span className="font-bold">{process.env.REACT_APP_SWAP_AMOUNT || '0.0'} ETH</span>
        </div>
      </div>
      {Boolean(stepStatus) && <p className="text-xs font-semibold text-gray-300">{stepStatus}</p>}
      <button
        type="button"
        className="flex justify-center rounded-md border-secondary bg-secondary px-4 py-1 font-semibold text-gray-100 shadow transition-all duration-300 ease-in-out hover:shadow-xl"
        onClick={handleExecuteBandB}
      >
        {stepStatus ? (
          <Setting2 size={24} variant="Outline" className="animate-spin" />
        ) : (
          'Execute Buy & Burn'
        )}
      </button>
    </div>
  );
};

export default BuyAndBurnComponent;
