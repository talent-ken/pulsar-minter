import { useEffect, useState } from 'react';
import { Connector, useConnect } from 'wagmi';

interface IWalletOption {
  connector: Connector;
  onClick: () => void;
}

const WalletOption = (props: IWalletOption) => {
  const { connector, onClick } = props;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const provider = await connector.getProvider();
      setReady(!!provider);
    })();
  }, [connector]);

  return (
    <button
      type="button"
      title={connector.name}
      disabled={!ready}
      onClick={onClick}
      className="flex h-9 w-full items-center justify-center gap-x-4 rounded bg-gray-200 px-4 py-1"
    >
      {Boolean(connector.icon) && (
        <img src={connector.icon} alt="connector icon" className="h-7 w-7" />
      )}
      <span className="font-medium">{connector.name}</span>
    </button>
  );
};

const WalletButton = () => {
  const { connectors, connect } = useConnect();

  return (
    <div className="flex w-full flex-col gap-y-1">
      {connectors.map((connector: Connector) => (
        <WalletOption
          key={connector.id}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
    </div>
  );
};

export default WalletButton;
