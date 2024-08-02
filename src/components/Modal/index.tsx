import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CloseSquare } from 'iconic-react';

interface IModal {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const ModalContent = (props: IModal) => {
  const { title, isOpen, onClose, children } = props;

  return (
    isOpen && (
      <div
        className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-theme/5"
        onClick={onClose}
      >
        <div
          className="relative rounded bg-gray-200/40"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex w-full items-center justify-between gap-x-20 px-4 py-4">
            <div className="font-semibold text-gray-100">{title}</div>
            <div
              onClick={onClose}
              className="cursor-pointer text-gray-300 transition-all duration-300 hover:text-gray-100"
            >
              <CloseSquare variant="Outline" />
            </div>
          </div>
          <div className="flex justify-center px-4 pb-4 pt-2">{children}</div>
        </div>
      </div>
    )
  );
};

const Modal = (props: IModal) => {
  const [isBrowser, setIsBrowser] = useState<boolean>(false);

  const { title, isOpen, onClose, children } = props;

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser
    ? createPortal(
        <ModalContent title={title} isOpen={isOpen} onClose={onClose}>
          {children}
        </ModalContent>,
        document.getElementById('app-modal-portal')!
      )
    : null;
};

export default Modal;
