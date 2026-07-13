import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthStatus, AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setUser, setStatus, clearAuth } = authSlice.actions;
export default authSlice.reducer;
