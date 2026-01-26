/**
 * Trades Page
 * 
 * Displays a paginated list of trades with:
 * - MUI Table with sorting
 * - Action buttons (View, Edit, Delete)
 * - Add Trade dialog
 * - Edit Trade dialog
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    Button,
    IconButton,
    Chip,
    Tooltip,
    Skeleton,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { tradesApi } from '../../services/api';
import TradeForm from '../../components/TradeForm/TradeForm';

function Trades() {
    const theme = useTheme();
    const navigate = useNavigate();

    // State
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingTradeId, setDeletingTradeId] = useState(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch trades
    const fetchTrades = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await tradesApi.getList({
                page: page + 1, // API is 1-indexed
                page_size: rowsPerPage,
            });
            setTrades(data.results || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            setError(err.message || 'Failed to load trades');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    // Handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAddClick = () => {
        setEditingTrade(null);
        setFormOpen(true);
    };

    const handleEditClick = async (tradeId) => {
        try {
            const trade = await tradesApi.getById(tradeId);
            setEditingTrade(trade);
            setFormOpen(true);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to load trade details',
                severity: 'error',
            });
        }
    };

    const handleViewClick = (tradeId) => {
        navigate(`/trades/${tradeId}`);
    };

    const handleDeleteClick = (tradeId) => {
        setDeletingTradeId(tradeId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await tradesApi.delete(deletingTradeId);
            setSnackbar({
                open: true,
                message: 'Trade deleted successfully',
                severity: 'success',
            });
            fetchTrades();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to delete trade',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setDeletingTradeId(null);
        }
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingTrade(null);
    };

    const handleFormSuccess = (message) => {
        setSnackbar({
            open: true,
            message,
            severity: 'success',
        });
        fetchTrades();
        handleFormClose();
    };

    // Format PnL with color
    const formatPnL = (pnl) => {
        const value = parseFloat(pnl || 0);
        const formatted = Math.abs(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return {
            text: value >= 0 ? `+₹${formatted}` : `-₹${formatted}`,
            color: value >= 0 ? theme.palette.success.main : theme.palette.error.main,
        };
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Box>
            {/* Page Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Trades
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your trading positions and view performance
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddClick}
                    sx={{ px: 3 }}
                >
                    Add Trade
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Trades Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Trade ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Tickers</TableCell>
                                <TableCell>Entry Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Legs</TableCell>
                                <TableCell align="right">PnL</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                // Loading skeletons
                                [...Array(5)].map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton width={40} /></TableCell>
                                        <TableCell><Skeleton width={150} /></TableCell>
                                        <TableCell><Skeleton width={80} /></TableCell>
                                        <TableCell><Skeleton width={100} /></TableCell>
                                        <TableCell><Skeleton width={70} /></TableCell>
                                        <TableCell><Skeleton width={30} /></TableCell>
                                        <TableCell align="right"><Skeleton width={80} /></TableCell>
                                        <TableCell align="center"><Skeleton width={100} /></TableCell>
                                    </TableRow>
                                ))
                            ) : trades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No trades found. Click "Add Trade" to create your first trade.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                trades.map((trade) => {
                                    const pnl = formatPnL(trade.pnl);
                                    return (
                                        <TableRow
                                            key={trade.trade_id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleViewClick(trade.trade_id)}
                                        >
                                            <TableCell>
                                                <Typography fontWeight={600} color="primary">
                                                    #{trade.trade_id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {trade.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {trade.tickers?.slice(0, 3).map((ticker, i) => (
                                                        <Chip
                                                            key={i}
                                                            label={ticker}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    ))}
                                                    {trade.tickers?.length > 3 && (
                                                        <Chip
                                                            label={`+${trade.tickers.length - 3}`}
                                                            size="small"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(trade.entry_date)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trade.is_open ? 'Open' : 'Closed'}
                                                    size="small"
                                                    color={trade.is_open ? 'warning' : 'success'}
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {trade.leg_count}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    fontWeight={600}
                                                    sx={{ color: pnl.color, fontFeatureSettings: '"tnum"' }}
                                                >
                                                    {pnl.text}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewClick(trade.trade_id)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditClick(trade.trade_id)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteClick(trade.trade_id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Card>

            {/* Trade Form Dialog */}
            <TradeForm
                open={formOpen}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
                trade={editingTrade}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Trade</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete trade #{deletingTradeId}? This will remove all associated legs and cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
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

export default Trades;
