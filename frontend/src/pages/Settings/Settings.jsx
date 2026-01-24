import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    Link,
    Chip,
    Skeleton,
} from '@mui/material';
import {
    OpenInNew as OpenInNewIcon,
    Save as SaveIcon,
    CheckCircle as CheckCircleIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { fyersApi } from '../../services/api';

function Settings() {
    const [authUrl, setAuthUrl] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Profile state
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState('');

    // Fetch profile on component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setProfileLoading(true);
        setProfileError('');
        try {
            const data = await fyersApi.getProfile();
            setProfile(data.profile);
        } catch (err) {
            setProfileError(err.message || 'Failed to fetch profile');
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleGenerateUrl = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fyersApi.getAuthUrl();
            setAuthUrl(data.auth_url);
            window.open(data.auth_url, '_blank');
        } catch (err) {
            setError(err.message || 'Failed to generate Auth URL');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToken = async () => {
        if (!authCode) {
            setError('Please enter the Auth Code or full URL');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await fyersApi.generateToken(authCode);
            setSuccess('Successfully connected to Fyers!');
            setAuthCode('');
            // Refresh profile after successful connection
            fetchProfile();
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.message || 'Failed to save token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Settings
            </Typography>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        Fyers Integration
                    </Typography>
                    {profile && <CheckCircleIcon color="success" />}
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Typography variant="body2" color="text.secondary" paragraph>
                    Connect your Fyers account to fetch live market prices. You need to re-authenticate daily as the token expires.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Step 1: Generate URL */}
                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                Step 1: Authenticate
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" paragraph>
                                Click the button below to open Fyers login page in a new tab. After login, copy the full URL or the 'auth_code' from the address bar.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={loading ? <CircularProgress size={20} /> : <OpenInNewIcon />}
                                onClick={handleGenerateUrl}
                                disabled={loading}
                            >
                                Open Fyers Login
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Step 2: Enter Code */}
                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                Step 2: Enter Auth Code
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" paragraph>
                                Paste the copied URL or Auth Code here.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Paste URL or Auth Code here..."
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                    disabled={loading}
                                    multiline
                                    maxRows={2}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSaveToken}
                                    disabled={loading || !authCode}
                                    sx={{ minWidth: 120 }}
                                >
                                    Connect
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Step 3: User Profile */}
                    <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Step 3: User Profile
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchProfile}
                                    disabled={profileLoading}
                                >
                                    Refresh
                                </Button>
                            </Box>
                            <Typography variant="caption" display="block" color="text.secondary" paragraph>
                                Live profile data from your connected Fyers account.
                            </Typography>

                            {profileLoading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="40%" />
                                    <Skeleton variant="text" width="50%" />
                                </Box>
                            ) : profileError ? (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    {profileError}
                                </Alert>
                            ) : profile ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon color="primary" />
                                        <Typography variant="body1" fontWeight="bold">
                                            {profile.name || 'N/A'}
                                        </Typography>
                                        <Chip
                                            label="Connected"
                                            color="success"
                                            size="small"
                                            sx={{ ml: 'auto' }}
                                        />
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Email</Typography>
                                            <Typography variant="body2">{profile.email_id || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">FY ID</Typography>
                                            <Typography variant="body2">{profile.fy_id || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">PAN</Typography>
                                            <Typography variant="body2">{profile.pan || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Mobile</Typography>
                                            <Typography variant="body2">{profile.mobile_number || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    No profile data. Please connect your Fyers account first.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Paper>
        </Box>
    );
}

export default Settings;

