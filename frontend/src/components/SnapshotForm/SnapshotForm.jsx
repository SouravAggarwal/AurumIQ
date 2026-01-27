/**
 * Snapshot Form Component
 * 
 * Dialog for creating and editing snapshots with:
 * - Dynamic leg management (add/remove)
 * - Form validation
 * - Loading states
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Grid,
    TextField,
    Button,
    IconButton,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    useTheme,
    alpha,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { snapshotsApi } from '../../services/api';

// Default empty leg
const getEmptyLeg = () => ({
    ticker: '',
    date: '',
    price: '',
    quantity: '',
});

function SnapshotForm({ open, onClose, onSuccess, snapshot }) {
    const theme = useTheme();
    const isEditing = Boolean(snapshot);

    // Form state
    const [snapshotName, setSnapshotName] = useState('');
    const [description, setDescription] = useState('');
    const [snapshotType, setSnapshotType] = useState('');
    const [legs, setLegs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

    // Initialize form with snapshot data when editing
    useEffect(() => {
        if (snapshot) {
            setSnapshotName(snapshot.name || '');
            setDescription(snapshot.description || '');
            setSnapshotType(snapshot.snapshot_type || '');
            if (snapshot.legs && snapshot.legs.length > 0) {
                setLegs(
                    snapshot.legs.map((leg) => ({
                        id: leg.id,
                        ticker: leg.ticker || '',
                        date: leg.date || '',
                        price: leg.price?.toString() || '',
                        quantity: leg.quantity?.toString() || '',
                    }))
                );
            } else {
                setLegs([]);
            }
        } else {
            setSnapshotName('');
            setDescription('');
            setSnapshotType('');
            setLegs([]);
        }
        setError(null);
        setErrors({});
    }, [snapshot, open]);

    // Handle leg field change
    const handleLegChange = (index, field, value) => {
        setLegs((prev) => {
            const newLegs = [...prev];
            newLegs[index] = { ...newLegs[index], [field]: value };
            return newLegs;
        });

        // Clear field error
        setErrors((prev) => {
            const key = `${index}.${field}`;
            const { [key]: _, ...rest } = prev;
            return rest;
        });
    };

    // Add new leg
    const handleAddLeg = () => {
        setLegs((prev) => [...prev, getEmptyLeg()]);
    };

    // Remove leg
    const handleRemoveLeg = (index) => {
        setLegs((prev) => prev.filter((_, i) => i !== index));
    };

    // Validate form
    const validate = () => {
        const newErrors = {};

        if (!snapshotName.trim()) {
            newErrors.snapshotName = 'Snapshot Name is required';
        }

        // Only validate legs if there are any
        legs.forEach((leg, index) => {
            if (!leg.ticker.trim()) {
                newErrors[`${index}.ticker`] = 'Ticker is required';
            }
            if (!leg.date) {
                newErrors[`${index}.date`] = 'Date is required';
            }
            if (!leg.price || parseFloat(leg.price) <= 0) {
                newErrors[`${index}.price`] = 'Valid price is required';
            }
            if (!leg.quantity || parseInt(leg.quantity) === 0) {
                newErrors[`${index}.quantity`] = 'Valid quantity is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        setError(null);

        try {
            const legsData = legs.map((leg) => ({
                ...(leg.id && { id: leg.id }),
                ticker: leg.ticker.toUpperCase().trim(),
                date: leg.date,
                price: parseFloat(leg.price),
                quantity: parseInt(leg.quantity),
            }));

            const payload = {
                name: snapshotName.trim(),
                description: description.trim(),
                snapshot_type: snapshotType || null,
                legs: legsData
            };

            if (isEditing) {
                await snapshotsApi.update(snapshot.snapshot_id, payload);
                onSuccess('Snapshot updated successfully');
            } else {
                await snapshotsApi.create(payload);
                onSuccess('Snapshot created successfully');
            }
        } catch (err) {
            setError(err.message || 'Failed to save snapshot');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight={600}>
                        {isEditing ? 'Edit Snapshot' : 'Add New Snapshot'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Snapshot Name"
                            value={snapshotName}
                            onChange={(e) => {
                                setSnapshotName(e.target.value);
                                if (errors.snapshotName) {
                                    setErrors(prev => ({ ...prev, snapshotName: null }));
                                }
                            }}
                            fullWidth
                            required
                            error={Boolean(errors.snapshotName)}
                            helperText={errors.snapshotName}
                            placeholder="e.g. Market Comparison 27 Jan 2025"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Optional notes about this snapshot..."
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel id="snapshot-type-label">Snapshot Type</InputLabel>
                            <Select
                                labelId="snapshot-type-label"
                                value={snapshotType}
                                label="Snapshot Type"
                                onChange={(e) => setSnapshotType(e.target.value)}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                <MenuItem value="GoldM">GoldM</MenuItem>
                                <MenuItem value="SilverM">SilverM</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {legs.map((leg, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            position: 'relative',
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Leg {index + 1}
                            </Typography>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveLeg(index)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Ticker"
                                    value={leg.ticker}
                                    onChange={(e) => handleLegChange(index, 'ticker', e.target.value.toUpperCase())}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.ticker`])}
                                    helperText={errors[`${index}.ticker`]}
                                    placeholder="e.g., NSE:SBIN-EQ"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    value={leg.date}
                                    onChange={(e) => handleLegChange(index, 'date', e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(errors[`${index}.date`])}
                                    helperText={errors[`${index}.date`]}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={leg.price}
                                    onChange={(e) => handleLegChange(index, 'price', e.target.value)}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.price`])}
                                    helperText={errors[`${index}.price`]}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Quantity"
                                    type="number"
                                    value={leg.quantity}
                                    onChange={(e) => handleLegChange(index, 'quantity', e.target.value)}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.quantity`])}
                                    helperText={errors[`${index}.quantity`] || 'Use negative for short positions'}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                ))}

                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddLeg}
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 1 }}
                >
                    Add Another Leg
                </Button>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={16} color="inherit" />}
                >
                    {loading ? 'Saving...' : isEditing ? 'Update Snapshot' : 'Create Snapshot'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SnapshotForm;
