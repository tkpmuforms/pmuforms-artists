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

export interface Appointment {
  _id: string;
  id: string;
  allFormsCompleted: boolean;
  customerId: string;
  artistId: string;
  date: string;
  services: number[];
  signed: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  formsToFillCount: number;
  filledForms: Array<{
    _id: string;
    appointmentId: string;
    status: string;
    id: string;
  }>;
  serviceDetails: Array<{
    _id: string;
    id: number;
    service: string;
  }>;
}

export interface AppointmentApiResponse {
  metadata: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    firstPage: number;
  };
  appointments: Appointment[];
}

export interface CustomerResponse {
  metadata: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    firstPage: number;
  };
  customers: Array<{
    _id: string;
    id: string;
    name: string;
    email?: string;
    lastLoggedIn: string | null;
    info: {
      client_name: string;
      avatar_url?: string;
      cell_phone?: string;
      date_of_birth?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      home_address?: string;
      referred?: string;
    };
    notes: Array<any>;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface Form {
  id: string;
  title: string;
  lastUpdated: string;
  usedFor: string;
  type: "consent" | "care";
  services: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SingleForm {
  id: string;
  title: string;
  sections: Section[];
}

export interface Section {
  _id?: string;
  id?: string;
  title: string;
  data: Field[];
  skip?: boolean;
}

export interface Field {
  id: string;
  title: string;
  type?: string;
  required?: boolean;
  line?: string;
}
