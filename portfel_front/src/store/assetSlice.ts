import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axios';
import { Asset } from '../types';

interface AssetState {
    assets: Asset[];
    loading: boolean;
    error: string | null;
}

const initialState: AssetState = {
    assets: [],
    loading: false,
    error: null,
};

export const fetchAssets = createAsyncThunk<Asset[]>(
    'assets/fetchAssets',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/assets/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const assetSlice = createSlice({
    name: 'assets',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssets.fulfilled, (state, action) => {
                state.loading = false;
                state.assets = action.payload;
            })
            .addCase(fetchAssets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default assetSlice.reducer;