import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Collapse, Box,
    IconButton, Typography, useTheme
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Portfolio } from '../../types';
import AssetTable from './AssetTable';

interface PortfolioTableProps {
    portfolios: Portfolio[];
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ portfolios }) => {
    const [expandedPortfolio, setExpandedPortfolio] = useState<number | null>(null);
    const theme = useTheme();

    const handleRowClick = (portfolioId: number) => {
        setExpandedPortfolio(expandedPortfolio === portfolioId ? null : portfolioId);
    };

    const formatNumber = (value: number | string, isPercent = false) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return 'N/A';

        return isPercent
            ? `${num.toFixed(2)}%`
            : new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'USD'
            }).format(num);
    };

    return (
        <TableContainer component={Paper} sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '& .MuiTableCell-root': {
                borderColor: theme.palette.secondary.main
            }
        }}>
            <Table>
                <TableHead>
                    <TableRow sx={{
                        '& .MuiTableCell-head': {
                            backgroundColor: theme.palette.secondary.main,
                            color: theme.palette.primary.main,
                            fontWeight: 'bold'
                        }
                    }}>
                        <TableCell></TableCell>
                        <TableCell>Название</TableCell>
                        <TableCell>Общая стоимость</TableCell>
                        <TableCell>Доходность (%)</TableCell>
                        <TableCell>Годовая доходность</TableCell>
                        <TableCell>Прибыль/Убыток</TableCell>
                        <TableCell>Дата создания</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {portfolios.map((portfolio) => (
                        <React.Fragment key={portfolio.Port_ID}>
                            <TableRow
                                hover
                                onClick={() => handleRowClick(portfolio.Port_ID)}
                                sx={{
                                    cursor: 'pointer',
                                    '& .MuiTableCell-body': {
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary,
                                        '&:first-of-type': { borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' },
                                        '&:last-of-type': { borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }
                                    },
                                    '&:hover .MuiTableCell-body': {
                                        backgroundColor: '#333333'
                                    }
                                }}
                            >
                                <TableCell>
                                    <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
                                        {expandedPortfolio === portfolio.Port_ID ?
                                            <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                    </IconButton>
                                </TableCell>
                                <TableCell>{portfolio.name}</TableCell>
                                <TableCell>{formatNumber(portfolio.total_value)}</TableCell>
                                <TableCell>{formatNumber(portfolio.yield_percent, true)}</TableCell>
                                <TableCell>{formatNumber(portfolio.annual_yield, true)}</TableCell>
                                <TableCell>{formatNumber(portfolio.profit_loss)}</TableCell>
                                <TableCell>
                                    {new Date(portfolio.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{ padding: 0 }} colSpan={7}>
                                    <Collapse in={expandedPortfolio === portfolio.Port_ID} timeout="auto" unmountOnExit>
                                        <Box sx={{ margin: 1 }}>
                                            <Typography variant="h6" gutterBottom component="div"
                                                        sx={{ color: theme.palette.primary.main }}>
                                                Активы портфеля
                                            </Typography>
                                            <AssetTable portfolioId={portfolio.Port_ID} />
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PortfolioTable;