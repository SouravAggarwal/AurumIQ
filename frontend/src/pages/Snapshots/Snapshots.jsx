/**
 * Snapshots Page
 * 
 * Displays a paginated list of snapshots with:
 * - MUI Table with sorting
 * - Action buttons (View, Edit, Delete)
 * - Add Snapshot dialog
 * - Edit Snapshot dialog
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
    CameraAlt as SnapshotIcon,
} from '@mui/icons-material';
import { snapshotsApi } from '../../services/api';
import SnapshotForm from '../../components/SnapshotForm/SnapshotForm';

function Snapshots() {
    const theme = useTheme();
    const navigate = useNavigate();

    // State
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingSnapshot, setEditingSnapshot] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingSnapshotId, setDeletingSnapshotId] = useState(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch snapshots
    const fetchSnapshots = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await snapshotsApi.getList({
                page: page + 1, // API is 1-indexed
                page_size: rowsPerPage,
            });
            setSnapshots(data.results || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            setError(err.message || 'Failed to load snapshots');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]);

    // Handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAddClick = () => {
        setEditingSnapshot(null);
        setFormOpen(true);
    };

    const handleEditClick = async (snapshotId) => {
        try {
            const snapshot = await snapshotsApi.getById(snapshotId);
            setEditingSnapshot(snapshot);
            setFormOpen(true);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to load snapshot details',
                severity: 'error',
            });
        }
    };

    const handleViewClick = (snapshotId) => {
        navigate(`/snapshots/${snapshotId}`);
    };

    const handleDeleteClick = (snapshotId) => {
        setDeletingSnapshotId(snapshotId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await snapshotsApi.delete(deletingSnapshotId);
            setSnackbar({
                open: true,
                message: 'Snapshot deleted successfully',
                severity: 'success',
            });
            fetchSnapshots();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || 'Failed to delete snapshot',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setDeletingSnapshotId(null);
        }
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingSnapshot(null);
    };

    const handleFormSuccess = (message) => {
        setSnackbar({
            open: true,
            message,
            severity: 'success',
        });
        fetchSnapshots();
        handleFormClose();
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
                        Snapshots
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track and compare ticker price movements over time
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddClick}
                    sx={{ px: 3 }}
                >
                    Add Snapshot
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Snapshots Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Snapshot ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Tickers</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell>Legs</TableCell>
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
                                        <TableCell><Skeleton width={120} /></TableCell>
                                        <TableCell><Skeleton width={100} /></TableCell>
                                        <TableCell><Skeleton width={30} /></TableCell>
                                        <TableCell align="center"><Skeleton width={100} /></TableCell>
                                    </TableRow>
                                ))
                            ) : snapshots.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                            <SnapshotIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                            <Typography color="text.secondary">
                                                No snapshots found. Click "Add Snapshot" to create your first snapshot.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                snapshots.map((snapshot) => (
                                    <TableRow
                                        key={snapshot.snapshot_id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleViewClick(snapshot.snapshot_id)}
                                    >
                                        <TableCell>
                                            <Typography fontWeight={600} color="primary">
                                                #{snapshot.snapshot_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight={500}>
                                                {snapshot.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {snapshot.tickers?.slice(0, 3).map((ticker, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={ticker}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.75rem' }}
                                                    />
                                                ))}
                                                {snapshot.tickers?.length > 3 && (
                                                    <Chip
                                                        label={`+${snapshot.tickers.length - 3}`}
                                                        size="small"
                                                        sx={{ fontSize: '0.75rem' }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(snapshot.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {snapshot.leg_count}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewClick(snapshot.snapshot_id)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(snapshot.snapshot_id)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(snapshot.snapshot_id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
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

            {/* Snapshot Form Dialog */}
            <SnapshotForm
                open={formOpen}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
                snapshot={editingSnapshot}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Snapshot</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete snapshot #{deletingSnapshotId}? This will remove all associated legs and cannot be undone.
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

export default Snapshots;
