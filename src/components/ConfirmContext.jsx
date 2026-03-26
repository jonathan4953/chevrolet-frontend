import React, { createContext, useContext, useState } from 'react';
import ConfirmModal from './ConfirmModal'; // Caminho para o modal que você criou

const ConfirmContext = createContext();

export const useConfirm = () => {
  return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({ isOpen: false, message: '' });
  const [resolver, setResolver] = useState({ resolve: null });

  const showConfirm = (message) => {
    // Retorna uma Promise para podermos usar await
    return new Promise((resolve) => {
      setModalState({ isOpen: true, message });
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    if (resolver.resolve) resolver.resolve(true); // Retorna true
    setModalState({ isOpen: false, message: '' });
  };

  const handleCancel = () => {
    if (resolver.resolve) resolver.resolve(false); // Retorna false
    setModalState({ isOpen: false, message: '' });
  };

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      {/* O modal fica renderizado aqui no topo da aplicação */}
      {modalState.isOpen && (
        <ConfirmModal 
          message={modalState.message} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
    </ConfirmContext.Provider>
  );
};