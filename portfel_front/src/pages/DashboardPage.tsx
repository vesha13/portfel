import React, { useEffect } from 'react';
import { Box, Typography, Alert, Grid } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPortfolio } from '../api/portfolio';
import { fetchAssets } from '../store/assetSlice';
import PortfolioTable from '../components/Portfolio/PortfolioTable';
import AssetGrid from '../components/Assets/AssetGrid';

const DashboardPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const { portfolios } = useAppSelector((state) => state.portfolio);
    const { assets } = useAppSelector((state) => state.assets);

    useEffect(() => {
        dispatch(fetchPortfolio());
        dispatch(fetchAssets());
    }, [dispatch]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Обзор портфелей
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Мои портфели
                    </Typography>
                    {portfolios.length > 0 ? (
                        <PortfolioTable portfolios={portfolios} />
                    ) : (
                        <Alert severity="info">Нет доступных портфелей</Alert>
                    )}
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Все активы
                    </Typography>
                    <AssetGrid assets={assets} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;