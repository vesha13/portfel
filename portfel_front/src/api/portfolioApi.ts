// portfolioApi.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';

export interface ApiPortfolioAssetResponse {
    ID: number;
    quantity: string | number;
    average_price: string | number;
    total_value: string | number;
    user_id?: number;
    portfolio_id?: number;
}

export interface TransformedPortfolioAsset {
    ID: number;
    quantity: number;
    average_price: number;
    total_value: number;
    user_id?: number;
    portfolio_id?: number;
}

export const portfolioApi = createApi({
    reducerPath: 'portfolioApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                headers.set('Authorization', `JWT ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getPortfolioAssets: builder.query<TransformedPortfolioAsset[], number>({
            query: (portfolioId) => `portfolios/${portfolioId}/assets/`,
            transformResponse: (response: ApiPortfolioAssetResponse[], meta, arg): TransformedPortfolioAsset[] => {
                const parseSafeFloat = (value: string | number | null | undefined): number => {
                    if (value === null || value === undefined) return 0;
                    const num = parseFloat(String(value));
                    return isNaN(num) ? 0 : num;
                };

                if (!Array.isArray(response)) {
                    console.error(`API response for getPortfolioAssets (arg: ${arg}) was not an array:`, response);
                    return [];
                }

                return response.map(item => ({
                    ...item,
                    quantity: parseSafeFloat(item.quantity),
                    average_price: parseSafeFloat(item.average_price),
                    total_value: parseSafeFloat(item.total_value),
                }));
            }
        }),
    }),
});

export const { useGetPortfolioAssetsQuery } = portfolioApi;