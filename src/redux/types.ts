export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  businessPhoneNumber?: string;
  avatarUrl?: string;
  documentPath?: string;
  documentId?: string;
  userId?: string;
  businessAddress?: string;
  website?: string;
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
  notifications?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  signature_url?: string;
  stripeSubscriptionActive?: boolean;
  stripeCustomerId?: string;
  defaultStripePaymentMethod?: string;
  stripeSubscriptionId?: string;
}

export interface Service {
  _id: string;
  id: number;
  service: string;
  /** a service this artist created; only they see it */
  custom?: boolean;
  documentPath?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** a client's appointments with this artist, sent with the client list */
export interface ClientSummary {
  appointmentCount: number;
  lastVisit: string | null;
  nextAppointment: string | null;
  formsPending: boolean;
  services: number[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  summary?: ClientSummary;
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
  // set when the artist marks the procedure done
  completedAt?: string | null;
  // who booked it, and who signed it off (since teams)
  createdBy?: ActorRef;
  performedBy?: ActorRef;
  // sent with the appointment list
  customer?: {
    id: string;
    info?: { client_name?: string; avatar_url?: string };
  } | null;
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
    notes: Array<Note>;
    summary?: ClientSummary;
    createdAt: string;
    updatedAt: string;
  }>;
}

// "pre-care" forms are instructions emailed before the appointment, never filled out
export type FormType = "consent" | "care" | "pre-care";

export interface Form {
  id: string;
  title: string;
  lastUpdated: string;
  usedFor: string;
  type: FormType;
  services: number[];
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
  versionNumber?: number;
  isDeleted?: boolean;
  /** the library form this one started from; "custom-…" for the artist's own */
  rootFormTemplateId?: string | null;
}

export interface SingleForm {
  id: string;
  title: string;
  sections: Section[];
  services?: number[];
  type: FormType;
  order?: number;
  versionNumber?: number;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Section {
  _id?: string;
  id: string;
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

export interface ClientAppointmentData {
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
  serviceDetails: ServiceDetail[];
  // set once the artist marks the procedure done
  completedAt?: string;
}

interface ServiceDetail {
  _id: string;
  id: number;
  service: string;
}

export interface FilledForm {
  _id: string;
  appointmentId: string;
  title: string;
  status: string;
  clientId: string;
  formTemplateId: string;
  isSkipped: boolean;
  createdAt: string;
  updatedAt: string;
  data: Record<string, any>;
  formTemplate: {
    title: string;
    type: string;
    sections: any[];
    /** the services this form is used for */
    services?: number[];
  };
  id: string;
}

export interface ApiResponse {
  metadata: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    firstPage: number;
  };
  filledForms: FilledForm[];
}

export interface Note {
  id: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
  date: string;
  artistId: string;
  _id: string;
  imageUrl?: string;
  // "email" and "client-photo" notes are written by the app as a record of
  // communication with the client, and can't be edited or deleted
  // "scheduled-email" is waiting to go out and can be cancelled; once sent it
  // is replaced by an "email" note
  kind?: "note" | "email" | "client-photo" | "scheduled-email";
  appointmentId?: string;
  subject?: string;
  messageType?: string;
  messageId?: string;
  sendAt?: string;
  // who wrote it (since teams; older notes are the owner's)
  addedBy?: ActorRef;
}

export interface Card {
  id: string;
  name: string;
  lastFour: string;
  brand: "mastercard" | "visa" | "amex" | "unionpay";
  isDefault: boolean;
  color: string;
}

export interface SubscriptionHistory {
  date: string;
  description: string;
  cardUsed: string;
  amount: number;
  status: "Successful" | "Failed" | "Pending";
}

/**
 * Who is signed in. A team member works in the owner's account (`user` is
 * the owner's), but under their own name, and can't open Settings.
 */
export type Me =
  | { id: string; role: "owner"; name: string }
  | {
      id: string;
      role: "member";
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      ownerName: string;
    };

/** Who did something, saved with what they did. */
export interface ActorRef {
  id: string;
  name: string;
}
