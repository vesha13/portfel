import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchPortfolio } from '../api/portfolio';
import { Portfolio } from '../types';

interface PortfolioState {
    portfolios: Portfolio[];
    loading: boolean;
    error: string | null;
}

const initialState: PortfolioState = {
    portfolios: [],
    loading: false,
    error: null,
};

const portfolioSlice = createSlice({
    name: 'portfolio',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPortfolio.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPortfolio.fulfilled, (state, action: PayloadAction<Portfolio[]>) => {
                state.loading = false;
                state.portfolios = action.payload;
            })
            .addCase(fetchPortfolio.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default portfolioSlice.reducer;