import { useCallback, useMemo, useState } from 'react';

import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';

import WalletButton from 'components/WalletButton';
import Modal from 'components/Modal';

const ConnectWallet = () => {
  const { disconnect } = useDisconnect();

  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const [isOpenModal, setIsOpenModal] = useState(false);

  const abbrevAddress = useMemo(() => {
    return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  }, [address]);

  const handleModalOpen = useCallback(() => {
    setIsOpenModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsOpenModal(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleModalOpen}
        className="bg-secondary flex w-full items-center justify-center gap-x-2 rounded px-4 py-1 text-sm font-semibold"
      >
        {ensAvatar && <img src={ensAvatar} alt="ens avatar" className="h-5 w-5" />}
        <span>
          {address ? (ensName ? `${ensName} (${abbrevAddress})` : abbrevAddress) : 'Connect Wallet'}
        </span>
      </button>
      <Modal title="Connect your wallet" isOpen={isOpenModal} onClose={handleModalClose}>
        {address ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="flex w-full items-center justify-center gap-x-4 rounded bg-gray-200 px-4 py-1 font-semibold text-gray-800"
          >
            Disconnect
          </button>
        ) : (
          <WalletButton />
        )}
      </Modal>
    </>
  );
};

export default ConnectWallet;
