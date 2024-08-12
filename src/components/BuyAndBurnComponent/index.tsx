import { useCallback, useEffect, useState } from 'react';

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

import { bnbAbi, pulsarAbi } from 'constants/abi';
import { createNonce, showNotification } from 'libs/libs';

const FUNC_SELECTOR = '8218b58f';

const pulseProvider = new ethers.JsonRpcProvider('https://rpc.sepolina.org');

const BuyAndBurnComponent = () => {
  const [stepStatus, setStepStatus] = useState('');
  const [bnbValue, setBnbValue] = useState<string>('0');

  const { address } = useAccount();

  const { data: hash, writeContract, status } = useWriteContract();
  const { isLoading } = useWaitForTransactionReceipt({ hash });

  const { data: balance, refetch: refetchPLSBalance } = useBalance({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`
  });

  const { data: totalIBurnSupply, refetch: refetchSupplyInterval } = useReadContract({
    address: process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS as `0x${string}`,
    abi: pulsarAbi,
    functionName: 'totalSupply',
    args: []
  });

  const { data: bnbInterval, refetch: refetchBnbInterval } = useReadContract({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
    abi: bnbAbi,
    functionName: 'burnInterval',
    args: []
  });

  const { data: lastActionTs, refetch: refetchLastAction } = useReadContract({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
    abi: bnbAbi,
    functionName: 'lastBurnTime',
    args: []
  });

  const { data: swapAmount, refetch: refetchSwapAmount } = useReadContract({
    address: process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
    abi: bnbAbi,
    functionName: 'swapAmount',
    args: []
  });

  const decodeEvent = useCallback((event: any) => {
    const iface = new ethers.Interface(bnbAbi);
    const decodedEvents = iface.decodeEventLog('BoughtAndBurnt', event.data, event.topics);
    return decodedEvents.getValue('amount');
  }, []);

  const getBnBValue = useCallback(async () => {
    const contract = new ethers.Contract(
      process.env.REACT_APP_BNB_CONTRACT_ADDRESS as `0x${string}`,
      bnbAbi,
      pulseProvider
    );

    const filter = contract.filters.BoughtAndBurnt();
    const bnbEvents = await contract.queryFilter(filter);

    let total = BigInt(0);
    bnbEvents.forEach((event) => {
      const decodedEvent = decodeEvent(event);
      total += BigInt(decodedEvent);
    });

    return (total / BigInt(10 ** DEFAULT_DECIMALS)).toLocaleString('us');
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
      refetchSwapAmount();
    }, 10000);

    const permissionInterval = setInterval(() => {
      refetchLastAction();
      refetchBnbInterval();
    }, 5000);

    return () => {
      clearInterval(settingInterval);
      clearInterval(permissionInterval);
    };
  }, [refetchBnbInterval, refetchLastAction, refetchPLSBalance, refetchSwapAmount]);

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
      swapAmount as BigInt,
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
    swapAmount,
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
          <span className="font-semibold uppercase">PULSAR Total Supply:</span>
          <span className="font-bold">
            {totalIBurnSupply
              ? `${(BigInt(totalIBurnSupply as string) / BigInt(10 ** DEFAULT_DECIMALS)).toLocaleString('us')} PULSAR`
              : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold uppercase">PULSAR Burnt Supply:</span>
          <span className="font-bold">{`${bnbValue} PULSAR`}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold uppercase">BNB ETH Balance:</span>
          <span className="font-bold">
            {balance?.value
              ? `${(BigInt(balance.value) / BigInt(10 ** balance.decimals)).toLocaleString('us')} ${balance.symbol}`
              : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold uppercase">Last BnB:</span>
          <span className="font-bold">
            {lastActionTs
              ? new Date(getIntValue(lastActionTs as BigInt) * 1000).toUTCString()
              : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold uppercase">Frequency:</span>
          <span className="font-bold">
            {bnbInterval ? formatMinutes(parseInt((bnbInterval as BigInt).toString())) : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-100">
          <span className="font-semibold uppercase">Swap Amount:</span>
          <span className="font-bold">
            {swapAmount
              ? `${(
                  BigInt(swapAmount as string) / BigInt(10 ** (DEFAULT_DECIMALS + DEFAULT_DECIMALS))
                ).toLocaleString('us')} ETH`
              : 'Unknown'}
          </span>
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
