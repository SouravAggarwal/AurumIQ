/**
 * Trade Details Page
 * 
 * Shows detailed view of a single trade with:
 * - Trade summary card
 * - Legs table
 * - Edit and Delete actions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Skeleton,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Breadcrumbs,
    Link,
    useTheme,
    alpha,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingUp as ProfitIcon,
    TrendingDown as LossIcon,
} from '@mui/icons-material';
import { tradesApi } from '../../services/api';
import TradeForm from '../../components/TradeForm/TradeForm';

function TradeDetails() {
    const { tradeId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    // State
    const [trade, setTrade] = useState(null);
    const [livePrices, setLivePrices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch trade details
    useEffect(() => {
        let mounted = true;

        const fetchTrade = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await tradesApi.getById(tradeId);

                if (mounted) {
                    setTrade(data);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || 'Failed to load trade details');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchTrade();

        return () => {
            mounted = false;
        };
    }, [tradeId]);

    // Live prices polling
    useEffect(() => {
        // Only poll if we have a trade with open legs
        const shouldPoll = trade?.legs?.some(l => l.is_open);

        if (!shouldPoll) return;

        const fetchLivePrices = async () => {
            try {
                const pricesData = await tradesApi.getLivePrices();
                setLivePrices(pricesData);
            } catch (err) {
                console.warn("Failed to fetch live prices", err);
            }
        };

        // Initial fetch for live prices
        fetchLivePrices();

        const interval = setInterval(fetchLivePrices, 15000);
        return () => clearInterval(interval);
    }, [trade]); // Re-run when trade data loads/changes

    // Handlers
    const handleBack = () => {
        navigate('/trades');
    };

    const handleEditClick = () => {
        setFormOpen(true);
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await tradesApi.delete(tradeId);
            setSnackbar({
                open: true,
                message: 'Trade deleted successfully',
                severity: 'success',
            });
            setTimeout(() => navigate('/trades'), 1000);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to delete trade',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    const handleFormSuccess = async (message) => {
        setSnackbar({
            open: true,
            message,
            severity: 'success',
        });
        setFormOpen(false);

        // Refresh trade data
        try {
            const data = await tradesApi.getById(tradeId);
            setTrade(data);
        } catch (err) {
            console.error('Failed to refresh trade:', err);
        }
    };

    // Format helpers
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        const num = parseFloat(value);
        return `$${num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatPnL = (value) => {
        const num = parseFloat(value || 0);
        const formatted = Math.abs(num).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return {
            text: num >= 0 ? `+$${formatted}` : `-$${formatted}`,
            color: num >= 0 ? theme.palette.success.main : theme.palette.error.main,
            isProfit: num >= 0,
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Calculate leg PnL
    const calculateLegPnL = (leg) => {
        if (!leg.is_open && leg.exit_price) {
            return (parseFloat(leg.exit_price) - parseFloat(leg.entry_price)) * leg.quantity;
        }

        // Calculate unrealized PnL if open and we have live price
        if (leg.is_open && livePrices && livePrices.prices && livePrices.prices[leg.ticker]) {
            const currentPrice = livePrices.prices[leg.ticker].ltp;
            return (currentPrice - parseFloat(leg.entry_price)) * leg.quantity;
        }

        return null;
    };

    // Calculate Total PnL (Realized + Unrealized)
    const totalPnL = trade ? trade.legs.reduce((sum, leg) => {
        const legPnL = calculateLegPnL(leg);
        if (legPnL !== null) return sum + legPnL;
        return sum;
    }, 0) : 0;

    // Use the calculated total PnL instead of just the stored realized PnL
    const pnl = formatPnL(totalPnL);

    if (loading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Skeleton variant="rectangular" height={200} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <Skeleton variant="rectangular" height={300} />
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
                    Back to Trades
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!trade) {
        return (
            <Box>
                <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
                    Back to Trades
                </Button>
                <Alert severity="warning">Trade not found</Alert>
            </Box>
        );
    }

    const hasOpenLegs = trade.legs?.some((leg) => leg.is_open);

    return (
        <Box>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    component="button"
                    underline="hover"
                    color="inherit"
                    onClick={handleBack}
                    sx={{ cursor: 'pointer' }}
                >
                    Trades
                </Link>
                <Typography color="text.primary">Trade #{trade.trade_id}</Typography>
            </Breadcrumbs>

            {/* Page Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        {trade.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={hasOpenLegs ? 'Open' : 'Closed'}
                            color={hasOpenLegs ? 'warning' : 'success'}
                            size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                            Trade ID: #{trade.trade_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {trade.legs?.length || 0} leg(s)
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEditClick}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                    >
                        Delete
                    </Button>
                </Box>
            </Box>

            {/* Summary Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Trade Summary
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    backgroundColor: alpha(pnl.color, 0.08),
                                    textAlign: 'center',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                    {pnl.isProfit ? (
                                        <ProfitIcon sx={{ color: pnl.color, mr: 1 }} />
                                    ) : (
                                        <LossIcon sx={{ color: pnl.color, mr: 1 }} />
                                    )}
                                    <Typography variant="overline" color="text.secondary">
                                        Total PnL
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="h3"
                                    fontWeight={700}
                                    sx={{ color: pnl.color, fontFeatureSettings: '"tnum"' }}
                                >
                                    {pnl.text}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Status
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {hasOpenLegs ? 'Open' : 'Closed'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Total Legs
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {trade.legs?.length || 0}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Open Legs
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {trade.legs?.filter((l) => l.is_open).length || 0}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Closed Legs
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {trade.legs?.filter((l) => !l.is_open).length || 0}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Legs Table */}
            <Card>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Trade Legs
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ticker</TableCell>
                                    <TableCell>Entry Date</TableCell>
                                    <TableCell>Exit Date</TableCell>
                                    <TableCell align="right">Entry Price</TableCell>
                                    <TableCell align="right">Current/Exit Price</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">PnL</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {trade.legs?.map((leg, index) => {
                                    const legPnL = calculateLegPnL(leg);
                                    const legPnLFormatted = legPnL !== null ? formatPnL(legPnL) : null;

                                    return (
                                        <TableRow key={leg.id || index}>
                                            <TableCell>
                                                <Chip label={leg.ticker} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>{formatDate(leg.entry_date)}</TableCell>
                                            <TableCell>{formatDate(leg.exit_date)}</TableCell>
                                            <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                                                {formatCurrency(leg.entry_price)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                                                {leg.is_open && livePrices?.prices?.[leg.ticker] ? (
                                                    <Box>
                                                        <Typography fontWeight={500}>
                                                            {formatCurrency(livePrices.prices[leg.ticker].ltp)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Live
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    formatCurrency(leg.exit_price)
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    sx={{
                                                        fontFeatureSettings: '"tnum"',
                                                        color: leg.quantity < 0 ? 'error.main' : 'text.primary',
                                                    }}
                                                >
                                                    {leg.quantity > 0 ? '+' : ''}{leg.quantity}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={leg.is_open ? 'Open' : 'Closed'}
                                                    size="small"
                                                    color={leg.is_open ? 'warning' : 'success'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {legPnLFormatted ? (
                                                    <Typography
                                                        fontWeight={600}
                                                        sx={{
                                                            color: legPnLFormatted.color,
                                                            fontFeatureSettings: '"tnum"',
                                                        }}
                                                    >
                                                        {legPnLFormatted.text}
                                                    </Typography>
                                                ) : (
                                                    <Typography color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Trade Form Dialog */}
            <TradeForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSuccess={handleFormSuccess}
                trade={trade}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Trade</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{trade.name}"? This will remove all associated legs and cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default TradeDetails;
