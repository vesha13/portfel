import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

interface ApiError {
    response?: {
        data: any;
        status: number;
        headers: any;
    };
    request?: any;
    message: string;
}

export const fetchPortfolio = createAsyncThunk(
    'portfolio/fetchPortfolio',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/ports/');
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                // Обработка ошибок Axios
                return rejectWithValue(error.response?.data || error.message);
            } else if (error instanceof Error) {
                // Обработка обычных ошибок
                return rejectWithValue(error.message);
            }
            // Обработка всех остальных случаев
            return rejectWithValue('Неизвестная ошибка');
        }
    }
);