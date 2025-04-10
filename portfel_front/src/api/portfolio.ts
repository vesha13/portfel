import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './axios';
import { Portfolio } from '../types';

export const fetchPortfolio = createAsyncThunk<Portfolio[]>(
    'portfolio/fetchPortfolio',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/ports/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);