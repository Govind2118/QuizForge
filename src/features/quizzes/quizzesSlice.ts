import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Quiz } from '@/types/quiz';
import * as quizApi from '@/api/quizApi';

interface QuizzesState {
  items: Quiz[];
  current?: Quiz;
  currentQuizId?: string;
  status: 'idle' | 'loading' | 'saving' | 'ready';
  error?: string;
}

const initialState: QuizzesState = {
  items: [],
  status: 'idle',
};

export const fetchMyQuizzes = createAsyncThunk('quizzes/listMine', quizApi.listMyQuizzes);
export const createQuiz = createAsyncThunk('quizzes/create', quizApi.createQuiz);
export const fetchQuiz = createAsyncThunk('quizzes/get', quizApi.getQuiz);
export const saveQuiz = createAsyncThunk('quizzes/save', quizApi.updateQuiz);
export const publishQuiz = createAsyncThunk('quizzes/publish', quizApi.publishQuiz);
export const deleteQuiz = createAsyncThunk('quizzes/delete', async (quizId: string) => {
  await quizApi.deleteQuiz(quizId);
  return quizId;
});

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    clearQuizError(state) {
      state.error = undefined;
    },
    setCurrentQuizDraft(state, action: { payload: Quiz }) {
      state.current = action.payload;
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyQuizzes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyQuizzes.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'ready';
      })
      .addCase(fetchMyQuizzes.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'ready';
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(fetchQuiz.pending, (state, action) => {
        state.status = 'loading';
        state.error = undefined;
        state.currentQuizId = action.meta.arg;
        if (state.current?.id !== action.meta.arg) state.current = undefined;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        if (state.currentQuizId !== action.meta.arg) return;
        state.current = action.payload;
        state.status = 'ready';
        state.error = undefined;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        if (state.currentQuizId !== action.meta.arg) return;
        state.error = action.error.message;
        state.status = 'ready';
        state.current = undefined;
      })
      .addCase(saveQuiz.pending, (state) => {
        state.status = 'saving';
        state.error = undefined;
      })
      .addCase(saveQuiz.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((quiz) => (quiz.id === action.payload.id ? action.payload : quiz));
        state.status = 'ready';
      })
      .addCase(saveQuiz.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'ready';
      })
      .addCase(publishQuiz.pending, (state) => {
        state.status = 'saving';
        state.error = undefined;
      })
      .addCase(publishQuiz.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((quiz) => (quiz.id === action.payload.id ? action.payload : quiz));
        state.status = 'ready';
      })
      .addCase(publishQuiz.rejected, (state, action) => {
        state.error = action.error.message;
        state.status = 'ready';
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.items = state.items.filter((quiz) => quiz.id !== action.payload);
        if (state.current?.id === action.payload) state.current = undefined;
      });
  },
});

export const { clearQuizError, setCurrentQuizDraft } = quizzesSlice.actions;
export default quizzesSlice.reducer;
