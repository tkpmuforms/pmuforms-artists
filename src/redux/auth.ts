import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  clients?: any[];
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

interface UserState {
  loading: boolean;
  user: User;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  loading: true,
  user: {},
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setLoading, setAuthenticated } = userSlice.actions;

export default userSlice.reducer;
