import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
    fetchPortfolioDetails,
    addAssetToPortfolio,
    fetchAllAssets,
    clearPortfolioError
} from '../store/slices/portfolioSlice';
import {Asset, PortfolioAsset} from '../types/portfolio';
import {
    Button,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete,
    Box,
    Alert
} from '@mui/material';
import {Add, Visibility} from '@mui/icons-material';
import PortfolioChart from '../components/PortfolioChart';

const formatNumber = (value: string | number | null | undefined, decimals: number = 2): string => {
    if (value == null) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
};

const PortfolioDetail = () => {
    const {id} = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        currentPortfolio,
        allAssets,
        status,
        error
    } = useAppSelector((state) => state.portfolio);

    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        dispatch(clearPortfolioError());
        if (id) {
            dispatch(fetchPortfolioDetails(Number(id)));
            dispatch(fetchAllAssets());
        }
    }, [dispatch, id]);

    const handleCloseDialog = () => {
        setShowAddForm(false);
        setSelectedAsset(null);
        setQuantity('');
        setPrice('');
    };

    const handleAddAsset = async () => {
        if (selectedAsset && quantity && price && currentPortfolio) {
            const resultAction = await dispatch(addAssetToPortfolio({
                portfolioId: currentPortfolio.Port_ID,
                assetId: selectedAsset.Asset_ID,
                quantity: parseFloat(quantity),
                price: parseFloat(price) // Sending purchase price for potential backend use
            }));

            if (addAssetToPortfolio.fulfilled.match(resultAction)) {
                handleCloseDialog();
                if (id) {
                    dispatch(fetchPortfolioDetails(Number(id))); // Refetch details to update view
                }
            } else {
                // Error is handled by the slice and displayed via state.error
                // You might want to keep the dialog open on error
                console.error("Failed to add asset:", resultAction.payload);
            }
        }
    };

    if (status === 'loading' && !currentPortfolio && !error) { // Show loading only on initial load without error
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    // Handle error during initial load specifically
    if (status === 'failed' && error && !currentPortfolio) {
        return (
            <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
                <Alert severity="error">Error loading portfolio details: {error}</Alert>
            </Container>
        );
    }

    // Handle case where loading finished but portfolio is still null (e.g., 404)
    if (status !== 'loading' && !currentPortfolio) {
        return (
            <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
                <Typography>Portfolio not found or unable to load.</Typography>
            </Container>
        );
    }

    // If currentPortfolio is somehow null despite checks, show loading as fallback
    if (!currentPortfolio) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }


    const portfolioProfitLossNum = currentPortfolio.profit_loss != null ? parseFloat(String(currentPortfolio.profit_loss)) : NaN;

    return (
        <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
            {/* Display persistent errors (like add asset failure) */}
            {status === 'failed' && error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: {xs: 'column', sm: 'row'},
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Typography variant="h4" component="h1">{currentPortfolio.name}</Typography>
                        <Button
                            variant="contained"
                            startIcon={(status === 'loading' && showAddForm) ?
                                <CircularProgress size={20} color="inherit"/> : <Add/>} // Loader only when adding
                            onClick={() => setShowAddForm(true)}
                            disabled={status === 'loading'} // Disable if any loading is happening
                        >
                            Add Asset
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8} lg={9}>
                    <Paper sx={{p: 2, display: 'flex', flexDirection: 'column', height: 400}}>
                        <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
                        {currentPortfolio.portfolio_assets && currentPortfolio.portfolio_assets.length > 0 ? (

                            <PortfolioChart/>
                        ) : (
                            <Typography
                                sx={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                Add assets to see the chart.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4} lg={3}>
                    <Paper sx={{p: 2, height: '100%'}}>
                        <Typography variant="h6" gutterBottom>Statistics</Typography>
                        <Typography>Total Value: ${formatNumber(currentPortfolio.total_value)}</Typography>
                        <Typography
                            color={isNaN(portfolioProfitLossNum) ? 'text.primary' : portfolioProfitLossNum >= 0 ? 'success.main' : 'error.main'}>
                            P/L: ${formatNumber(currentPortfolio.profit_loss)}
                        </Typography>
                        <Typography>Annual Yield: ${formatNumber(currentPortfolio.annual_yield)}</Typography>
                        <Typography>Yield: {formatNumber(currentPortfolio.yield_percent)}%</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{p: 2, overflow: 'hidden'}}>
                        <Typography variant="h6" gutterBottom>Portfolio Assets</Typography>
                        <TableContainer sx={{maxHeight: 440}}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ticker</TableCell>
                                        <TableCell>Company</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Avg Price</TableCell>
                                        <TableCell align="right">Current Price</TableCell>
                                        <TableCell align="right">Total Value</TableCell>
                                        <TableCell align="right">P/L ($)</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {currentPortfolio.portfolio_assets?.length > 0 ? (
                                        currentPortfolio.portfolio_assets.map((pa: PortfolioAsset) => {
                                            if (!pa.asset) return <TableRow key={`pa-${pa.ID}-missing`}><TableCell
                                                colSpan={8}>Asset data missing for ID {pa.ID}</TableCell></TableRow>;

                                            const avgPriceNum = pa.average_price != null ? parseFloat(String(pa.average_price)) : NaN;
                                            const currentPriceNum = pa.asset.current_price != null ? parseFloat(String(pa.asset.current_price)) : NaN;
                                            const quantityNum = pa.quantity != null ? parseFloat(String(pa.quantity)) : NaN;

                                            const currentValue = !isNaN(currentPriceNum) && !isNaN(quantityNum) ? currentPriceNum * quantityNum : NaN;
                                            const costBasis = !isNaN(avgPriceNum) && !isNaN(quantityNum) ? avgPriceNum * quantityNum : NaN;
                                            const profitLoss = !isNaN(currentValue) && !isNaN(costBasis) ? currentValue - costBasis : NaN;

                                            return (
                                                <TableRow hover key={`pa-${pa.ID}`}>
                                                    <TableCell>{pa.asset.ticker}</TableCell>
                                                    <TableCell>{pa.asset.company}</TableCell>
                                                    <TableCell align="right">{formatNumber(pa.quantity, 4)}</TableCell>
                                                    <TableCell
                                                        align="right">${formatNumber(pa.average_price)}</TableCell>
                                                    <TableCell
                                                        align="right">${formatNumber(pa.asset.current_price)}</TableCell>
                                                    <TableCell align="right">${formatNumber(currentValue)}</TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{color: isNaN(profitLoss) ? 'text.primary' : profitLoss >= 0 ? 'success.main' : 'error.main'}}
                                                    >
                                                        ${formatNumber(profitLoss)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            aria-label="view asset details"
                                                            size="small"
                                                            onClick={() => navigate(`/assets/${pa.asset.Asset_ID}`)}
                                                        >
                                                            <Visibility/>
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">No assets in this portfolio
                                                yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{p: 2, overflow: 'hidden'}}>
                        <Typography variant="h6" gutterBottom>Available Assets</Typography>
                        <TableContainer sx={{maxHeight: 440}}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ticker</TableCell>
                                        <TableCell>Company</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="right">Currency</TableCell>
                                        <TableCell align="right">Yield (%)</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allAssets && allAssets.length > 0 ? (
                                        allAssets.map((asset: Asset) => (
                                            <TableRow hover key={`asset-${asset.Asset_ID}`}>
                                                <TableCell>{asset.ticker}</TableCell>
                                                <TableCell>{asset.company}</TableCell>
                                                <TableCell
                                                    align="right">${formatNumber(asset.current_price)}</TableCell>
                                                <TableCell align="right">{asset.currency}</TableCell>
                                                <TableCell
                                                    align="right">{formatNumber(asset.dividend_yield)}%</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setPrice(asset.current_price != null ? String(asset.current_price) : '');
                                                            setShowAddForm(true);
                                                        }}
                                                        disabled={status === 'loading'}
                                                    >
                                                        Add to Portfolio
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                {status === 'loading' && !allAssets ? 'Loading available assets...' : 'No available assets found.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={showAddForm} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add Asset to Portfolio</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        options={allAssets || []}
                        getOptionLabel={(option) => option ? `${option.ticker} - ${option.company}` : ''}
                        value={selectedAsset}
                        onChange={(event, newValue: Asset | null) => {
                            setSelectedAsset(newValue);
                            if (newValue) {
                                setPrice(newValue.current_price != null ? String(newValue.current_price) : '');
                            } else {
                                setPrice('');
                            }
                        }}
                        isOptionEqualToValue={(option, value) => option?.Asset_ID === value?.Asset_ID}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Asset"
                                margin="normal"
                                fullWidth
                            />
                        )}
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        inputProps={{min: "0", step: "any"}}
                        required
                        error={quantity !== '' && (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0)}
                        helperText={quantity !== '' && (isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) ? "Quantity must be a positive number" : ""}
                    />
                    <TextField
                        label="Purchase Price per Share"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        inputProps={{min: "0", step: "any"}}
                        required
                        error={price !== '' && (isNaN(parseFloat(price)) || parseFloat(price) < 0)}
                        helperText={price !== '' && (isNaN(parseFloat(price)) || parseFloat(price) < 0) ? "Price must be a non-negative number" : ""}
                    />
                    {/* Display error from backend specifically in the dialog */}
                    {status === 'failed' && error && showAddForm &&
                        <Alert severity="error" sx={{mt: 1}}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleAddAsset}
                        variant="contained"
                        disabled={!selectedAsset || !quantity || !price || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0 || isNaN(parseFloat(price)) || parseFloat(price) < 0 || status === 'loading'}
                    >
                        {status === 'loading' ? <CircularProgress size={24} color="inherit"/> : "Add Asset"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PortfolioDetail;