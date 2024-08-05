import { BrowserRouter as Router } from 'react-router-dom';

import { Helmet } from 'react-helmet';
import { Bounce, ToastContainer } from 'react-toastify';

import { WagmiProvider, http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Header from 'components/Header';
import Footer from 'components/Footer';
import Minter from 'components/Minter';
import { TokenContextProvider } from 'context/token.context';

import PulsarImg from 'assets/images/pulsar.webp';

const config = createConfig({
  chains: [sepolia],
  connectors: [
    walletConnect({
      projectId: process.env.REACT_APP_WALLET_CONNECT_ID || '',
      qrModalOptions: {
        themeMode: 'dark'
      }
    })
  ],
  transports: {
    [sepolia.id]: http()
  }
});

const queryClient = new QueryClient();

const AppContainer = () => {
  return (
    <>
      <Helmet>
        <title>Pulsar Minter | GIFFORD Tech</title>
        <meta name="description" content="Official minting website for StayBull token"></meta>
      </Helmet>
      <Router>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <Header />
            <main className="flex h-full flex-col items-center justify-center gap-y-6 px-4 md:px-6 lg:px-10">
              <TokenContextProvider>
                <a
                  title="Header-icon"
                  href="/"
                  className="flex flex-col items-center justify-center gap-y-4"
                >
                  <div className="flex items-center justify-center gap-x-6">
                    <img src={PulsarImg} alt="header icon" className="h-12 w-12 md:h-20 md:w-20" />
                  </div>
                </a>
                <Minter />
              </TokenContextProvider>
            </main>
            <Footer />
            <div id="app-modal-portal" className="relative"></div>
          </QueryClientProvider>
        </WagmiProvider>
      </Router>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss
        draggable
        theme="colored"
        transition={Bounce}
        bodyClassName=""
        stacked
      />
    </>
  );
};

export default AppContainer;
