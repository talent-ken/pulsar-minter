import { useCallback, useMemo, useEffect, useState } from 'react';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Setting2 } from 'iconic-react';

import { useTokenContext } from 'context/token.context';

import ConnectWallet from 'components/ConnectWallet';
import TokenInput, { FALLBACK_ADDRESS } from 'components/TokenInput';
import PriceDisplay from 'components/PriceDisplay';

import { lusdAbi, stayBullAbi } from 'constants/abi';
import { TokenTypes } from 'constants/constants';

import LusdImg from 'assets/images/lusd.webp';
import StayBullImg from 'assets/images/staybull.webp';
import Pls from 'assets/images/pls.webp';
import { showNotification } from 'libs/libs';

const Minter = () => {
  const { address } = useAccount();
  const { plsAmountInteger, lusdAmount, lusdBalance, lusdPLSPrice } = useTokenContext();
  const { data: hash, writeContract, status, error } = useWriteContract();

  const [isMintable, setIsMintable] = useState(false);

  const { data: nopeAllowance, refetch: refetchNope } = useReadContract({
    address: process.env.REACT_APP_LUSD_CONTRACT_ADDRESS as `0x${string}`,
    abi: lusdAbi || [],
    functionName: 'allowance',
    args: [
      address || FALLBACK_ADDRESS,
      process.env.REACT_APP_STAYBULL_CONTRACT_ADDRESS as `0x${string}`
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchNope();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchNope]);

  const { isLoading } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (error) {
      showNotification((error as any)?.shortMessage || 'Something went wrong', 'error');
    }
  }, [error]);

  useEffect(() => {
    if (isLoading === false && status === 'success') {
      showNotification('Transaction successful', 'success');
    }
  }, [isLoading, status]);

  const needAllowance = useMemo(() => {
    const nopeAllowanceBigInt: BigInt = (nopeAllowance as BigInt) || 0n;
    return parseInt(lusdAmount?.toString()) > parseInt(nopeAllowanceBigInt?.toString());
  }, [nopeAllowance, lusdAmount]);

  useEffect(() => {
    setIsMintable(!needAllowance && lusdAmount !== 0n);
  }, [lusdAmount, needAllowance]);

  const handleApprove = useCallback(async () => {
    if (lusdAmount > lusdBalance) {
      showNotification('Insufficient LUSD balance', 'error');
      return;
    }

    writeContract({
      address: process.env.REACT_APP_LUSD_CONTRACT_ADDRESS as `0x${string}`,
      abi: lusdAbi || [],
      functionName: 'approve',
      args: [
        process.env.REACT_APP_STAYBULL_CONTRACT_ADDRESS as `0x${string}`,
        BigInt(lusdAmount.toString())
      ]
    });
  }, [lusdAmount, lusdBalance, writeContract]);

  const handleMint = useCallback(async () => {
    writeContract({
      address: process.env.REACT_APP_STAYBULL_CONTRACT_ADDRESS as `0x${string}`,
      abi: stayBullAbi || [],
      functionName: 'mint',
      args: [lusdAmount],
      value: BigInt(parseInt(lusdAmount.toString()) * parseFloat(lusdPLSPrice) * 1.01)
    });
  }, [lusdAmount, lusdPLSPrice, writeContract]);

  const handleButtonClick = useCallback(() => {
    if (status === 'pending' || isLoading) return;
    if (needAllowance) {
      handleApprove();
      return;
    }
    if (isMintable) {
      handleMint();
      return;
    }
  }, [handleApprove, handleMint, isLoading, isMintable, needAllowance, status]);

  return (
    <div className="flex w-full max-w-7xl items-start justify-center">
      <div className="flex w-full flex-col gap-y-4 rounded-xl border-2 border-secondary bg-gray-700/20 px-4 py-6 shadow-2xl md:w-130">
        <TokenInput
          tokenType={TokenTypes.LUSD}
          classNames="rounded-md border-2 border-theme shadow-lg"
          tokenImage={LusdImg}
          abi={lusdAbi}
          api={`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${process.env.REACT_APP_LUSD_PAIR_ADDRESS}`}
          label="Send LUSD"
          contractAddress={process.env.REACT_APP_LUSD_CONTRACT_ADDRESS as `0x${string}`}
          tokenImageUrl={process.env.REACT_APP_SITE_URL + '/lusd.webp'}
        />
        <TokenInput
          tokenType={TokenTypes.STAY_BULL}
          classNames="rounded-md border-2 border-secondary shadow-lg"
          tokenImage={StayBullImg}
          abi={stayBullAbi}
          api={`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${process.env.REACT_APP_STAYBULL_PAIR_ADDRESS}`}
          label="Mint StayBULL"
          contractAddress={process.env.REACT_APP_STAYBULL_CONTRACT_ADDRESS as `0x${string}`}
          tokenImageUrl={process.env.REACT_APP_SITE_URL + '/staybull.webp'}
        />
        <div className="flex w-full flex-col gap-y-2 rounded-md border-2 border-gray-400 bg-gray-900/40 p-2 backdrop-blur-lg">
          <div className="flex justify-between border-b border-gray-600 py-2 font-bold text-gray-400">
            <span>Protocol Fee:</span>
            <div className="item-center flex gap-x-2">
              <img src={Pls} alt="PLS token" className="h-6 w-6" />
              <span className="pt-0.25">
                {Number(plsAmountInteger.toFixed(1)).toLocaleString('en')} PLS
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <PriceDisplay
              title="PLS"
              api={`https://api.dexscreener.com/latest/dex/pairs/pulsechain/${process.env.REACT_APP_WPLS_PAIR_ADDRESS}`}
            />
          </div>
        </div>
        {address ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-x-2 rounded bg-secondary px-4 py-1 font-semibold"
            onClick={handleButtonClick}
          >
            {status === 'pending' || isLoading ? (
              <Setting2 size={24} variant="Outline" className="animate-spin" />
            ) : needAllowance ? (
              'Approve LUSD'
            ) : isMintable ? (
              'Mint StayBULL'
            ) : (
              'Enter Amount'
            )}
          </button>
        ) : (
          <ConnectWallet />
        )}
      </div>
    </div>
  );
};

export default Minter;
