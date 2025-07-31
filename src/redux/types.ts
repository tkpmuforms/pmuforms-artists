export interface User {
  _id?: string;
  documentPath?: string;
  documentId?: string;
  userId?: string;
  email?: string;
  businessName?: string;
  businessUri?: string;
  isActive?: boolean;
  appStorePurchaseActive?: boolean;
  canSendPromotionEmails?: boolean;
  clients?: Client[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  services?: Service[];
  lastLoggedIn?: Date | null;
  // Optional fields for compatibility with other parts of the app
  info?: {
    avatar_url?: string;
  };
  notifications?: number;
}

export interface Service {
  _id: string;
  id: number;
  service: string;
  documentPath?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}
