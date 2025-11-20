"use client";

import { useState, useEffect } from "react";
import { AddressModal } from "./address-modal";

interface AddressModalWrapperProps {
  userRole: string;
  hasAddress: boolean;
}

export function AddressModalWrapper({ userRole, hasAddress }: AddressModalWrapperProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Zeige Modal nur für LANDLORDS ohne Adresse
    if (userRole === "LANDLORD" && !hasAddress) {
      // Prüfe ob Modal bereits geschlossen wurde (in localStorage)
      const addressModalClosed = localStorage.getItem("addressModalClosed");
      if (!addressModalClosed) {
        setShowModal(true);
      }
    }
  }, [userRole, hasAddress]);

  const handleClose = () => {
    setShowModal(false);
    // Speichere, dass Modal geschlossen wurde
    localStorage.setItem("addressModalClosed", "true");
  };

  return <AddressModal open={showModal} onClose={handleClose} />;
}

