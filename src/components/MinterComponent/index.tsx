import { useCallback, useMemo, useEffect, useState } from 'react';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Setting2 } from 'iconic-react';

import { useTokenContext } from 'context/token.context';

import ConnectWallet from 'components/ConnectWallet';
import TokenInput, { FALLBACK_ADDRESS } from 'components/TokenInput';
import PriceDisplay from 'components/PriceDisplay';

import { titanxAbi, pulsarAbi } from 'constants/abi';
import { TokenTypes } from 'constants/constants';

import TitanXImg from 'assets/images/titanx.webp';
import PulsarImg from 'assets/images/pulsar.webp';
import Ethereum from 'assets/images/ethereum.webp';
import { createNonce, showNotification } from 'libs/libs';
import BigNumber from 'bignumber.js';

const Minter = () => {
  const { address } = useAccount();
  const { wEthValue, wEthAmount, titanXAmount, titanXBalance, priceDenominator } =
    useTokenContext();
  const { data: hash, writeContract, status, error } = useWriteContract();

  const [isMintable, setIsMintable] = useState(false);

  const { data: titanXAllowance, refetch: refetchTitanXAllowance } = useReadContract({
    address: process.env.REACT_APP_TITANX_CONTRACT_ADDRESS as `0x${string}`,
    abi: titanxAbi || [],
    functionName: 'allowance',
    args: [
      address || FALLBACK_ADDRESS,
      process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS as `0x${string}`
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchTitanXAllowance();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchTitanXAllowance]);

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
    const titanXAllowanceBigInt: BigInt = (titanXAllowance as BigInt) || 0n;
    return parseInt(titanXAmount?.toString()) > parseInt(titanXAllowanceBigInt?.toString());
  }, [titanXAllowance, titanXAmount]);

  useEffect(() => {
    setIsMintable(!needAllowance && titanXAmount !== 0n);
  }, [titanXAmount, needAllowance]);

  const handleApprove = useCallback(async () => {
    if (titanXAmount > titanXBalance) {
      showNotification('Insufficient LUSD balance', 'error');
      return;
    }

    writeContract({
      address: process.env.REACT_APP_TITANX_CONTRACT_ADDRESS as `0x${string}`,
      abi: titanxAbi || [],
      functionName: 'approve',
      args: [
        process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS as `0x${string}`,
        BigInt(titanXAmount.toString())
      ]
    });
  }, [titanXAmount, titanXBalance, writeContract]);

  const getSignatureAndDeadline = async (priceDenominator: string, nonce: number) => {
    const api = 'https://pulsar-sig-manager.vercel.app/api';
    const res = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          priceDenominator,
          nonce
        }
      })
    });

    const payload = await res.json();

    return payload.payload;
  };

  const handleMint = useCallback(async () => {
    const nonce = createNonce();
    if (!priceDenominator) {
      showNotification('Unable to fetch price at the moment. Please try again!', 'error');
      return;
    }

    const { signature, deadline } = await getSignatureAndDeadline(priceDenominator, nonce);

    console.log({
      titanXAmount,
      priceDenominator: BigInt(priceDenominator),
      nonce,
      deadline,
      signature,
      value: BigNumber(wEthAmount.toString()).div(1e18).toString()
    });

    await writeContract({
      address: process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS as `0x${string}`,
      abi: pulsarAbi || [],
      functionName: 'mint',
      args: [titanXAmount, BigInt(priceDenominator), nonce, deadline, signature],
      value: wEthAmount
    });
  }, [priceDenominator, titanXAmount, wEthAmount, writeContract]);

  console.error({ error });

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
      <div className="flex w-full flex-col gap-y-4 rounded-xl border-2 border-secondary bg-gray-700/50 px-4 py-6 shadow-2xl backdrop-blur-xl md:w-130">
        <TokenInput
          tokenType={TokenTypes.TITANX}
          classNames="rounded-md border-2 border-theme shadow-lg"
          tokenImage={TitanXImg}
          abi={titanxAbi}
          api={`https://api.dexscreener.com/latest/dex/pairs/ethereum/${process.env.REACT_APP_TITANX_PAIR_ADDRESS}`}
          label="Send TITANX"
          contractAddress={process.env.REACT_APP_TITANX_CONTRACT_ADDRESS as `0x${string}`}
          tokenImageUrl={process.env.REACT_APP_SITE_URL + '/titanx.webp'}
        />
        <TokenInput
          tokenType={TokenTypes.PULSAR}
          classNames="rounded-md border-2 border-secondary shadow-lg"
          tokenImage={PulsarImg}
          abi={pulsarAbi}
          api={`https://api.dexscreener.com/latest/dex/pairs/ethereum/${process.env.REACT_APP_PULSAR_PAIR_ADDRESS}`}
          label="Mint PULSAR"
          contractAddress={process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS as `0x${string}`}
          tokenImageUrl={process.env.REACT_APP_SITE_URL + '/pulsar.webp'}
        />
        <div className="flex w-full flex-col gap-y-2 rounded-md border-2 border-gray-600 bg-gray-900/40 p-2 backdrop-blur-lg">
          <div className="flex justify-between border-b border-gray-600 py-2 font-bold text-gray-300">
            <span>Protocol Fee:</span>
            <div className="item-center flex gap-x-2">
              <img src={Ethereum} alt="PLS token" className="h-6 w-6" />
              <span className="pt-0.25">{Number(wEthValue).toLocaleString('en')} ETH</span>
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <PriceDisplay
              title="ETH"
              api={`https://api.dexscreener.com/latest/dex/pairs/ethereum/${process.env.REACT_APP_WETH_PAIR_ADDRESS}`}
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
              'Approve TITANX'
            ) : isMintable ? (
              'Mint PULSAR'
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
