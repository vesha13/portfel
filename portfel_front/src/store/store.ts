import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './authSlice';
import portfolioReducer from './portfolioSlice';
import { portfolioApi } from '../api/portfolioApi'; // Импортируем API

export const store = configureStore({
    reducer: {
        auth: authReducer,
        portfolio: portfolioReducer,
        [portfolioApi.reducerPath]: portfolioApi.reducer, // Добавляем редюсер API
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(portfolioApi.middleware), // Добавляем middleware
});

// Настройка listeners для refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;