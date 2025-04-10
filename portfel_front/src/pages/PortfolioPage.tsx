import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPortfolio } from '../api/portfolio';
import PortfolioTable from '../components/Portfolio/PortfolioTable';

const PortfolioPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { portfolios, loading, error } = useAppSelector((state) => state.portfolio);

    useEffect(() => {
        dispatch(fetchPortfolio());
    }, [dispatch]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Мои портфели
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}
            {loading ? (
                <CircularProgress />
            ) : (
                <PortfolioTable portfolios={portfolios} />
            )}
        </Box>
    );
};

export default PortfolioPage;