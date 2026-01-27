/**
 * Snapshot Details Page
 * 
 * Shows detailed view of a single snapshot with:
 * - Snapshot summary card
 * - Legs table with current prices and movement calculations
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
    TableSortLabel,
    Chip,
    Skeleton,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Breadcrumbs,
    Link,
    useTheme,
    alpha,
    TextField,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingUp as UpIcon,
    TrendingDown as DownIcon,
    Save as SaveIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { snapshotsApi } from '../../services/api';
import SnapshotForm from '../../components/SnapshotForm/SnapshotForm';

function SnapshotDetails() {
    const { snapshotId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    // State
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState('');

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Sort state
    const [sortColumn, setSortColumn] = useState('ticker');
    const [sortDirection, setSortDirection] = useState('asc');

    // Fetch snapshot details
    useEffect(() => {
        let mounted = true;

        const fetchSnapshot = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await snapshotsApi.getById(snapshotId);

                if (mounted) {
                    setSnapshot(data);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || 'Failed to load snapshot details');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchSnapshot();

        return () => {
            mounted = false;
        };
    }, [snapshotId]);

    // Handlers
    const handleBack = () => {
        navigate('/snapshots');
    };

    const handleEditClick = () => {
        setFormOpen(true);
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await snapshotsApi.delete(snapshotId);
            setSnackbar({
                open: true,
                message: 'Snapshot deleted successfully',
                severity: 'success',
            });
            setTimeout(() => navigate('/snapshots'), 1000);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to delete snapshot',
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

        // Refresh snapshot data
        try {
            const data = await snapshotsApi.getById(snapshotId);
            setSnapshot(data);
        } catch (err) {
            console.error('Failed to refresh snapshot:', err);
        }
    };

    const handleSaveDescription = async () => {
        try {
            await snapshotsApi.update(snapshotId, { description: descriptionDraft });
            setSnapshot({ ...snapshot, description: descriptionDraft });
            setIsEditingDescription(false);
            setSnackbar({
                open: true,
                message: 'Notes updated successfully',
                severity: 'success',
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to update notes',
                severity: 'error',
            });
        }
    };

    // Format helpers
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        const num = parseFloat(value);
        return `₹${num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatMovement = (value) => {
        if (value === null || value === undefined) return { text: '-', color: theme.palette.text.secondary };
        const num = parseFloat(value);
        const formatted = Math.abs(num).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return {
            text: num >= 0 ? `+₹${formatted}` : `-₹${formatted}`,
            color: num >= 0 ? theme.palette.success.main : theme.palette.error.main,
            isPositive: num >= 0,
        };
    };

    const formatPercentage = (value) => {
        if (value === null || value === undefined) return { text: '-', color: theme.palette.text.secondary };
        const num = parseFloat(value);
        return {
            text: num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`,
            color: num >= 0 ? theme.palette.success.main : theme.palette.error.main,
        };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
        }).replace(' ', '-');
    };

    // Sort handler
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get sorted legs
    const getSortedLegs = () => {
        if (!snapshot?.legs) return [];

        return [...snapshot.legs].sort((a, b) => {
            let aVal, bVal;

            switch (sortColumn) {
                case 'ticker':
                    aVal = a.ticker || '';
                    bVal = b.ticker || '';
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                case 'date':
                    aVal = a.date ? new Date(a.date).getTime() : 0;
                    bVal = b.date ? new Date(b.date).getTime() : 0;
                    break;
                case 'price':
                    aVal = parseFloat(a.price) || 0;
                    bVal = parseFloat(b.price) || 0;
                    break;
                case 'current_price':
                    aVal = parseFloat(a.current_price) || 0;
                    bVal = parseFloat(b.current_price) || 0;
                    break;
                case 'points_moved':
                    aVal = parseFloat(a.points_moved) || 0;
                    bVal = parseFloat(b.points_moved) || 0;
                    break;
                case 'percentage_moved':
                    aVal = parseFloat(a.percentage_moved) || 0;
                    bVal = parseFloat(b.percentage_moved) || 0;
                    break;
                case 'days_since_snapshot':
                    aVal = a.days_since_snapshot ?? 0;
                    bVal = b.days_since_snapshot ?? 0;
                    break;
                case 'quantity':
                    aVal = a.quantity || 0;
                    bVal = b.quantity || 0;
                    break;
                default:
                    return 0;
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    };

    const sortedLegs = getSortedLegs();

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
                    Back to Snapshots
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!snapshot) {
        return (
            <Box>
                <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
                    Back to Snapshots
                </Button>
                <Alert severity="warning">Snapshot not found</Alert>
            </Box>
        );
    }

    // Calculate summary stats
    const totalPositiveLegs = snapshot.legs?.filter(l => l.percentage_moved && l.percentage_moved >= 0).length || 0;
    const totalNegativeLegs = snapshot.legs?.filter(l => l.percentage_moved && l.percentage_moved < 0).length || 0;

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
                    Snapshots
                </Link>
                <Typography color="text.primary">Snapshot #{snapshot.snapshot_id}</Typography>
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
                        {snapshot.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Snapshot ID: #{snapshot.snapshot_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {snapshot.legs?.length || 0} ticker(s)
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
                        Snapshot Summary
                    </Typography>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Total Tickers
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {snapshot.legs?.length || 0}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <UpIcon sx={{ color: 'success.main', fontSize: 18 }} />
                                        <Typography variant="overline" color="text.secondary" display="block">
                                            Up
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight={600} color="success.main">
                                        {totalPositiveLegs}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <DownIcon sx={{ color: 'error.main', fontSize: 18 }} />
                                        <Typography variant="overline" color="text.secondary" display="block">
                                            Down
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight={600} color="error.main">
                                        {totalNegativeLegs}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="overline" color="text.secondary" display="block">
                                        Created
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {formatDate(snapshot.created_at)}
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
                        Ticker Comparison
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortColumn === 'ticker'}
                                            direction={sortColumn === 'ticker' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('ticker')}
                                        >
                                            Ticker
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortColumn === 'date'}
                                            direction={sortColumn === 'date' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('date')}
                                        >
                                            Snapshot Date
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'price'}
                                            direction={sortColumn === 'price' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('price')}
                                        >
                                            Snapshot Price
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'current_price'}
                                            direction={sortColumn === 'current_price' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('current_price')}
                                        >
                                            Current Price
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'points_moved'}
                                            direction={sortColumn === 'points_moved' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('points_moved')}
                                        >
                                            Points Moved
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'percentage_moved'}
                                            direction={sortColumn === 'percentage_moved' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('percentage_moved')}
                                        >
                                            % Change
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'days_since_snapshot'}
                                            direction={sortColumn === 'days_since_snapshot' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('days_since_snapshot')}
                                        >
                                            Days Since
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={sortColumn === 'quantity'}
                                            direction={sortColumn === 'quantity' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('quantity')}
                                        >
                                            Quantity
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedLegs.map((leg, index) => {
                                    const movement = formatMovement(leg.points_moved);
                                    const percentage = formatPercentage(leg.percentage_moved);

                                    return (
                                        <TableRow key={leg.id || index}>
                                            <TableCell>
                                                <Chip label={leg.ticker} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>{formatDate(leg.date)}</TableCell>
                                            <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                                                {formatCurrency(leg.price)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                                                {leg.current_price ? formatCurrency(leg.current_price) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    sx={{
                                                        color: movement.color,
                                                        fontWeight: 600,
                                                        fontFeatureSettings: '"tnum"',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-end',
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    {movement.isPositive !== undefined && (
                                                        movement.isPositive ? <UpIcon fontSize="small" /> : <DownIcon fontSize="small" />
                                                    )}
                                                    {movement.text}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    sx={{
                                                        color: percentage.color,
                                                        fontWeight: 600,
                                                        fontFeatureSettings: '"tnum"',
                                                    }}
                                                >
                                                    {percentage.text}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography sx={{ fontFeatureSettings: '"tnum"' }}>
                                                    {leg.days_since_snapshot !== null ? `${leg.days_since_snapshot} days` : '-'}
                                                </Typography>
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
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Snapshot Form Dialog */}
            <SnapshotForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSuccess={handleFormSuccess}
                snapshot={snapshot}
            />

            {/* Description/Notes Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Notes
                        </Typography>
                        {!isEditingDescription ? (
                            <IconButton onClick={() => {
                                setDescriptionDraft(snapshot.description || '');
                                setIsEditingDescription(true);
                            }} size="small">
                                <EditIcon fontSize="small" />
                            </IconButton>
                        ) : (
                            <Box>
                                <IconButton onClick={() => setIsEditingDescription(false)} size="small" color="error">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                                <IconButton onClick={handleSaveDescription} size="small" color="primary">
                                    <SaveIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {isEditingDescription ? (
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            variant="outlined"
                            placeholder="Add notes about this snapshot..."
                            value={descriptionDraft}
                            onChange={(e) => setDescriptionDraft(e.target.value)}
                        />
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                            {snapshot.description || 'No notes added.'}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Snapshot</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{snapshot.name}"? This will remove all associated legs and cannot be undone.
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

export default SnapshotDetails;
