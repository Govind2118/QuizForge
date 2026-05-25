import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import quizzesReducer from '@/features/quizzes/quizzesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quizzes: quizzesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
