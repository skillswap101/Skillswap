import React from 'react';
import { User } from '../types';
import { UnifiedCheckoutModal } from './UnifiedCheckoutModal';

export interface StripeTransaction {
  id: string;
  packageName: string;
  credits: number;
  amount: number;
  cardName: string;
  cardLast4: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex' | 'Card';
  status: 'succeeded' | 'processing' | 'failed';
  date: string;
}

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddCredits: (amount: number) => void;
  showToast: (msg: string) => void;
}

/**
 * StripeCheckoutModal delegates to the multi-gateway UnifiedCheckoutModal
 * with 'stripe' pre-selected, allowing the user to pay with Card or seamlessly
 * toggle to M-Pesa or PayPal as desired.
 */
export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddCredits,
  showToast,
}) => {
  return (
    <UnifiedCheckoutModal
      isOpen={isOpen}
      onClose={onClose}
      currentUser={currentUser}
      initialGateway="stripe"
      onSuccess={(credits) => {
        onAddCredits(credits);
      }}
      showToast={showToast}
    />
  );
};
