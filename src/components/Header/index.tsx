import ConnectWallet from 'components/ConnectWallet';

const Header = () => (
  <header className="flex w-full justify-center px-4 md:px-6 lg:px-10">
    <div className="flex w-full max-w-7xl items-center justify-end py-4">
      <div>
        <ConnectWallet />
      </div>
    </div>
  </header>
);

export default Header;
