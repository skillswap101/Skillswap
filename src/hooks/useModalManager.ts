import { useState, useCallback } from 'react';

export interface ModalState {
  // Skill & Proposals
  postSkill: boolean;
  proposeSwap: boolean;
  skillDetail: boolean;
  skillPreview: boolean;
  roadmap: boolean;
  availability: boolean;
  successStories: boolean;
  inviteFriend: boolean;
  voiceCoach: boolean;
  calendarSync: boolean;

  // Swaps & Sessions
  sessionRoom: boolean;
  chat: boolean;
  callAction: boolean;
  aiAssistant: boolean;
  aiMatchmaker: boolean;

  // Settings & Compliance
  settings: boolean;
  terms: boolean;
  auth: boolean;

  // Commerce & Escrow
  stripeCheckout: boolean;
  unifiedCheckout: boolean;

  // Features & Directory
  audit: boolean;
  badges: boolean;
  portfolio: boolean;
  userDirectory: boolean;
  emailNotifications: boolean;
}

const initialModalState: ModalState = {
  postSkill: false,
  proposeSwap: false,
  skillDetail: false,
  skillPreview: false,
  roadmap: false,
  availability: false,
  successStories: false,
  inviteFriend: false,
  voiceCoach: false,
  calendarSync: false,
  sessionRoom: false,
  chat: false,
  callAction: false,
  aiAssistant: false,
  aiMatchmaker: false,
  settings: false,
  terms: false,
  auth: false,
  stripeCheckout: false,
  unifiedCheckout: false,
  audit: false,
  badges: false,
  portfolio: false,
  userDirectory: false,
  emailNotifications: false,
};

export function useModalManager() {
  const [modals, setModals] = useState<ModalState>(initialModalState);

  const openModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggleModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const closeAll = useCallback(() => {
    setModals(initialModalState);
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAll,
    setModals,
  };
}
