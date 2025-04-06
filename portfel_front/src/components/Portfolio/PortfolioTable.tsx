import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface PortfolioTableProps {
    portfolios: any[]; // Замените any на ваш тип
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ portfolios }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Общая стоимость</TableCell>
                        <TableCell>Доходность</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {portfolios.map((portfolio) => (
                        <TableRow key={portfolio.Port_ID}>
                            <TableCell>{portfolio.name}</TableCell>
                            <TableCell>${portfolio.total_value}</TableCell>
                            <TableCell>{portfolio.yield_percent}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PortfolioTable;