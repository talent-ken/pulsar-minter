import { useCallback, useState } from 'react';

import MinterComponent from 'components/MinterComponent';
import BuyAndBurnComponent from 'components/BuyAndBurnComponent';

const Minter = () => {
  const [activePage, setActivePage] = useState(0);

  const handlePageChange = useCallback((page: number) => {
    setActivePage(page);
  }, []);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4">
      <div className="flex items-center gap-x-4">
        <button
          type="button"
          className="rounded-md border-secondary bg-secondary px-4 py-1 font-medium text-gray-900 shadow hover:shadow-xl"
          onClick={() => handlePageChange(0)}
        >
          Mint iBurn
        </button>
        <button
          type="button"
          className="rounded-md border-secondary bg-secondary px-4 py-1 font-medium text-gray-100 shadow hover:shadow-xl"
          onClick={() => handlePageChange(1)}
        >
          Decentralized B&B
        </button>
      </div>
      <div className="flex w-full max-w-7xl items-start justify-center">
        {activePage === 0 ? <MinterComponent /> : <BuyAndBurnComponent />}
      </div>
    </div>
  );
};

export default Minter;
