import React, { useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    AppBar,
    Toolbar,
    CssBaseline,
    Button,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import AccountCircle from '@mui/icons-material/AccountCircle'; 

const mockQuotes = [
    { ticker: 'AAPL', name: 'Apple Inc.', lastPrice: 150.45, change: '+1.25%' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', lastPrice: 2750.30, change: '-0.50%' },
    { ticker: 'TSLA', name: 'Tesla Inc.', lastPrice: 750.80, change: '+2.75%' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', lastPrice: 3400.00, change: '-0.25%' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', lastPrice: 299.90, change: '+0.90%' },
];

const theme = createTheme({
    palette: {
        primary: {
            main: '#ffeb3b',
        },
        secondary: {
            main: '#000000',
        },
        background: {
            default: '#4d4d2a',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffeb3b',
        },
    },
});

const App: React.FC = () => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null); // Для меню профиля

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        alert('Вы вышли из аккаунта');
        handleMenuClose();
    };

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const response = await axios.post(
                    'https://api-invest.tinkoff.ru/openapi/market/stocks',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer YOUR_TOKEN_HERE`,
                        },
                    }
                );

                const stocks = response.data.payload.instruments;

                const quotesData = stocks.map((stock: any) => ({
                    figi: stock.figi,
                    ticker: stock.ticker,
                    lastPrice: stock.lastPrice,
                }));

            } catch (err) {
            }
        };

        fetchQuotes();
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
                        InvestEase
                    </Typography>

                    <Button color="inherit" onClick={() => alert('Переход на главную')}>
                        Главная
                    </Button>
                    <Button color="inherit" onClick={() => alert('Переход в портфель')}>
                        Портфель
                    </Button>
                    <Button color="inherit" onClick={() => alert('Переход в аналитику')}>
                        Аналитика
                    </Button>

                    <IconButton color="inherit" onClick={handleMenuOpen}>
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => alert('Переход в личный кабинет')}>
                            Личный кабинет
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <TableContainer component={Paper} sx={{ margin: '20px auto', maxWidth: 800, backgroundColor: '#1e1e1e' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Тикер</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Название</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Цена</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Изменение</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockQuotes.map((quote) => (
                            <TableRow key={quote.ticker}>
                                <TableCell sx={{ color: 'text.primary' }}>{quote.ticker}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>{quote.name}</TableCell>
                                <TableCell sx={{ color: 'text.primary' }}>${quote.lastPrice.toFixed(2)}</TableCell>
                                <TableCell
                                    sx={{
                                        color: quote.change.startsWith('+') ? 'primary.main' : 'error.main',
                                    }}
                                >
                                    {quote.change}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </ThemeProvider>
    );
};

export default App;