import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Me, User } from "./types";

interface UserState {
  loading: boolean;
  user: User;
  // the owner or a team member; null until /api/auth/me answers
  me?: Me | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  loading: true,
  user: {},
  me: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setMe: (state, action: PayloadAction<Me | null>) => {
      state.me = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setMe, setLoading, setAuthenticated } =
  userSlice.actions;

export default userSlice.reducer;
