/**
 * Trade Form Component
 * 
 * Dialog for creating and editing trades with:
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
    FormControlLabel,
    Switch,
    Divider,
    Alert,
    CircularProgress,
    Paper,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { tradesApi } from '../../services/api';

// Default empty leg
const getEmptyLeg = () => ({
    name: '',
    ticker: '',
    is_open: true,
    entry_date: '',
    exit_date: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
});

function TradeForm({ open, onClose, onSuccess, trade }) {
    const theme = useTheme();
    const isEditing = Boolean(trade);

    // Form state
    const [legs, setLegs] = useState([getEmptyLeg()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

    // Initialize form with trade data when editing
    useEffect(() => {
        if (trade && trade.legs) {
            setLegs(
                trade.legs.map((leg) => ({
                    id: leg.id,
                    name: leg.name || '',
                    ticker: leg.ticker || '',
                    is_open: leg.is_open ?? true,
                    entry_date: leg.entry_date || '',
                    exit_date: leg.exit_date || '',
                    entry_price: leg.entry_price?.toString() || '',
                    exit_price: leg.exit_price?.toString() || '',
                    quantity: leg.quantity?.toString() || '',
                }))
            );
        } else {
            setLegs([getEmptyLeg()]);
        }
        setError(null);
        setErrors({});
    }, [trade, open]);

    // Handle leg field change
    const handleLegChange = (index, field, value) => {
        setLegs((prev) => {
            const newLegs = [...prev];
            newLegs[index] = { ...newLegs[index], [field]: value };

            // If closing a position, clear exit fields if empty
            if (field === 'is_open' && !value) {
                // Position is now closed
            } else if (field === 'is_open' && value) {
                // Position is now open - can optionally clear exit fields
            }

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
        // Copy name from first leg for consistency
        const newLeg = getEmptyLeg();
        if (legs.length > 0) {
            newLeg.name = legs[0].name;
        }
        setLegs((prev) => [...prev, newLeg]);
    };

    // Remove leg
    const handleRemoveLeg = (index) => {
        if (legs.length <= 1) return;
        setLegs((prev) => prev.filter((_, i) => i !== index));
    };

    // Validate form
    const validate = () => {
        const newErrors = {};

        legs.forEach((leg, index) => {
            if (!leg.name.trim()) {
                newErrors[`${index}.name`] = 'Name is required';
            }
            if (!leg.ticker.trim()) {
                newErrors[`${index}.ticker`] = 'Ticker is required';
            }
            if (!leg.entry_date) {
                newErrors[`${index}.entry_date`] = 'Entry date is required';
            }
            if (!leg.entry_price || parseFloat(leg.entry_price) <= 0) {
                newErrors[`${index}.entry_price`] = 'Valid entry price is required';
            }
            if (!leg.quantity || parseInt(leg.quantity) === 0) {
                newErrors[`${index}.quantity`] = 'Valid quantity is required';
            }

            // Closed position validation
            if (!leg.is_open) {
                if (!leg.exit_date) {
                    newErrors[`${index}.exit_date`] = 'Exit date is required for closed positions';
                }
                if (!leg.exit_price || parseFloat(leg.exit_price) <= 0) {
                    newErrors[`${index}.exit_price`] = 'Exit price is required for closed positions';
                }
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
                name: leg.name.trim(),
                ticker: leg.ticker.toUpperCase().trim(),
                is_open: leg.is_open,
                entry_date: leg.entry_date,
                exit_date: leg.is_open ? null : leg.exit_date || null,
                entry_price: parseFloat(leg.entry_price),
                exit_price: leg.is_open ? null : (leg.exit_price ? parseFloat(leg.exit_price) : null),
                quantity: parseInt(leg.quantity),
            }));

            if (isEditing) {
                await tradesApi.update(trade.trade_id, { legs: legsData });
                onSuccess('Trade updated successfully');
            } else {
                await tradesApi.create({ legs: legsData });
                onSuccess('Trade created successfully');
            }
        } catch (err) {
            setError(err.message || 'Failed to save trade');
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
                        {isEditing ? 'Edit Trade' : 'Add New Trade'}
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
                            {legs.length > 1 && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveLeg(index)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Trade Name"
                                    value={leg.name}
                                    onChange={(e) => handleLegChange(index, 'name', e.target.value)}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.name`])}
                                    helperText={errors[`${index}.name`]}
                                    placeholder="e.g., Apple Long Position"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Ticker"
                                    value={leg.ticker}
                                    onChange={(e) => handleLegChange(index, 'ticker', e.target.value.toUpperCase())}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.ticker`])}
                                    helperText={errors[`${index}.ticker`]}
                                    placeholder="e.g., AAPL"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Entry Date"
                                    type="date"
                                    value={leg.entry_date}
                                    onChange={(e) => handleLegChange(index, 'entry_date', e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(errors[`${index}.entry_date`])}
                                    helperText={errors[`${index}.entry_date`]}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Entry Price"
                                    type="number"
                                    value={leg.entry_price}
                                    onChange={(e) => handleLegChange(index, 'entry_price', e.target.value)}
                                    fullWidth
                                    size="small"
                                    error={Boolean(errors[`${index}.entry_price`])}
                                    helperText={errors[`${index}.entry_price`]}
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
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={leg.is_open}
                                            onChange={(e) => handleLegChange(index, 'is_open', e.target.checked)}
                                            color="warning"
                                        />
                                    }
                                    label={leg.is_open ? 'Position Open' : 'Position Closed'}
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>

                            {/* Exit fields - only show when position is closed */}
                            {!leg.is_open && (
                                <>
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Exit Details
                                            </Typography>
                                        </Divider>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Exit Date"
                                            type="date"
                                            value={leg.exit_date}
                                            onChange={(e) => handleLegChange(index, 'exit_date', e.target.value)}
                                            fullWidth
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            error={Boolean(errors[`${index}.exit_date`])}
                                            helperText={errors[`${index}.exit_date`]}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Exit Price"
                                            type="number"
                                            value={leg.exit_price}
                                            onChange={(e) => handleLegChange(index, 'exit_price', e.target.value)}
                                            fullWidth
                                            size="small"
                                            error={Boolean(errors[`${index}.exit_price`])}
                                            helperText={errors[`${index}.exit_price`]}
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </Grid>
                                </>
                            )}
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
                    {loading ? 'Saving...' : isEditing ? 'Update Trade' : 'Create Trade'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default TradeForm;
