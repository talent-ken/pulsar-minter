import { ReactComponent as Telegram } from 'assets/svgs/telegram.svg';
import { ReactComponent as Twitter } from 'assets/svgs/twitter-x.svg';

import StayBullImg from 'assets/images/pulsar.webp';

const Footer = () => {
  return (
    <footer data-testid="footer" className="flex w-full flex-col items-center gap-y-3 pb-4 pt-8">
      <a title="footer-icon" href="/">
        <img src={StayBullImg} alt="footer icon" className="h-16 w-16" />
      </a>
      <div className="flex flex-col items-center gap-y-2">
        <div className="flex gap-x-2 text-gray-100">
          <a
            title="footer-social-twitter"
            href={process.env.REACT_APP_TWITTER_URL}
            rel="noreferrer noopener"
            target="_blank"
            className="h-8 w-8"
          >
            <Twitter className="h-full w-full" />
          </a>
          <a
            title="footer-social-telegram"
            href={process.env.REACT_APP_TELEGRAM_URL}
            rel="noreferrer noopener"
            target="_blank"
            className="h-8 w-8"
          >
            <Telegram className="h-full w-full" />
          </a>
        </div>
        <a
          data-testid="footer-giff-contract"
          href={`https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/address/${process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS}`}
          title="footer-pgiff-address"
          rel="noreferrer noopener"
          className="flex items-center rounded-full bg-gray-200/20 px-2 py-0.5 text-sm font-medium text-gray-100 underline-offset-2 hover:underline"
          target="_blank"
        >
          LUSD Contract
          <span className="hidden md:block">: {process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS}</span>
        </a>
        <a
          data-testid="footer-pgiff-contract"
          href={`https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#/address/${process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS}`}
          title="footer-bnb-contract"
          rel="noreferrer noopener"
          className="flex items-center rounded-full bg-gray-200/20 px-2 py-0.5 text-sm font-medium text-gray-100 underline-offset-2 hover:underline"
          target="_blank"
        >
          StayBULL Contract
          <span className="hidden md:block">: {process.env.REACT_APP_PULSAR_CONTRACT_ADDRESS}</span>
        </a>
        <div
          data-testid="footer-copyright"
          className="rounded-full bg-gray-200/20 px-2 py-0.5 text-sm font-medium text-gray-100"
        >
          Copyright &copy;{' '}
          {new Date(
            new Date().toLocaleString('en', { timeZone: 'America/New_York' })
          ).getFullYear()}
          , All Rights Reserved.
        </div>
        <a
          title="footer-disclamer"
          data-testid="footer-copyright-disclaimer"
          href={process.env.REACT_APP_DISCLAIMER_HASH}
          rel="noopener noreferrer"
          className="rounded-full bg-gray-200/20 px-2 py-0.5 text-sm font-medium text-gray-100 underline-offset-2 hover:underline"
          target="_blank"
        >
          Disclaimer
        </a>
      </div>
    </footer>
  );
};

export default Footer;
