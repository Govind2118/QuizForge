import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authApi from '@/api/authApi';
import type { AuthSession } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  error?: string;
}

const initialState: AuthState = {
  session: null,
  status: 'idle',
};

export const bootstrapSession = createAsyncThunk('auth/bootstrap', authApi.getCurrentSession);
export const login = createAsyncThunk('auth/login', async (payload: { email: string; password: string }) =>
  authApi.login(payload.email, payload.password),
);
export const register = createAsyncThunk('auth/register', async (payload: { email: string; password: string; name?: string }) =>
  authApi.register(payload.email, payload.password, payload.name),
);
export const logout = createAsyncThunk('auth/logout', authApi.logout);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = action.payload ? 'authenticated' : 'anonymous';
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'authenticated';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'anonymous';
        state.error = action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'authenticated';
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'anonymous';
        state.error = action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.session = null;
        state.status = 'anonymous';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
