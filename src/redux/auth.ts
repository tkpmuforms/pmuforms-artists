import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id?: string;
  name?: string;
  email?: string;
  accessToken?: string;
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
