/**
 * Analysis Page
 * 
 * Dashboard showing summarized analytics from trades:
 * - Summary cards (Total Open/Closed, PnL stats)
 * - PnL over time chart
 * - Open vs Closed trades pie chart
 */

import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Skeleton,
    Alert,
    useTheme,
    alpha,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    ShowChart as ChartIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    AccountBalance as TotalIcon,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { analyticsApi, tradesApi } from '../../services/api';

/**
 * Stat Card Component
 */
function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
    const theme = useTheme();

    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="overline"
                            sx={{
                                color: 'text.secondary',
                                letterSpacing: '0.1em',
                                fontSize: '0.7rem',
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mt: 1,
                                fontFeatureSettings: '"tnum"',
                                color: color || 'text.primary',
                            }}
                        >
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', mt: 0.5 }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(color || theme.palette.primary.main, 0.1),
                            color: color || theme.palette.primary.main,
                        }}
                    >
                        <Icon sx={{ fontSize: 24 }} />
                    </Box>
                </Box>
                {trend !== undefined && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mt: 2,
                            color: trend >= 0 ? 'success.main' : 'error.main',
                        }}
                    >
                        {trend >= 0 ? (
                            <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : (
                            <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography variant="caption" fontWeight={500}>
                            {Math.abs(trend).toFixed(1)}% from last month
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Loading skeleton for stat cards
 */
function StatCardSkeleton() {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width={100} height={20} />
                <Skeleton variant="text" width={140} height={40} sx={{ mt: 1 }} />
                <Skeleton variant="text" width={120} height={20} sx={{ mt: 0.5 }} />
            </CardContent>
        </Card>
    );
}

/**
 * Custom tooltip for the line chart
 */
function ChartTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        const value = parseFloat(payload[0].value);
        return (
            <Box
                sx={{
                    backgroundColor: 'background.paper',
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ color: value >= 0 ? 'success.main' : 'error.main' }}
                >
                    {value >= 0 ? '+' : ''}${value.toLocaleString()}
                </Typography>
            </Box>
        );
    }
    return null;
}

function Analysis() {
    const theme = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {
    //     fetchAnalytics();
    // }, []);

    // const fetchAnalytics = async () => {
    //     try {
    //         setLoading(true);
    //         setError(null);
    //         const data = await analyticsApi.getSummary();
    //         setAnalytics(data);
    //     } catch (err) {
    //         setError(err.message || 'Failed to load analytics');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Format currency
    const formatCurrency = (value) => {
        const num = parseFloat(value || 0);
        const prefix = num >= 0 ? '+₹' : '-₹';
        return prefix + Math.abs(num).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const analyticsData = await analyticsApi.getSummary();
                setAnalytics(analyticsData);
            } catch (err) {
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Calculate total values
    const totalOpenTradesPnL = parseFloat(analytics?.open_trades_pnl || 0);

    // Prepare pie chart data
    const pieData = analytics ? [
        { name: 'Open Trades', value: analytics.total_open_trades, color: theme.palette.warning.main },
        { name: 'Closed Trades', value: analytics.total_closed_trades, color: theme.palette.success.main },
    ] : [];

    // Prepare line chart data
    const lineData = analytics?.pnl_over_time?.map((item) => ({
        date: item.date,
        pnl: parseFloat(item.pnl),
    })) || [];

    return (
        <Box>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Portfolio Analysis
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Overview of your trading performance and key metrics
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Live Data Status */}


            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Total Trades"
                            value={(analytics?.total_open_trades || 0) + (analytics?.total_closed_trades || 0)}
                            subtitle="All time"
                            icon={TotalIcon}
                            color={theme.palette.primary.main}
                        />
                    )}
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Open Trades"
                            value={analytics?.total_open_trades || 0}
                            subtitle="Currently active"
                            icon={LockOpenIcon}
                            color={theme.palette.warning.main}
                        />
                    )}
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Closed Trades"
                            value={analytics?.total_closed_trades || 0}
                            subtitle="Completed"
                            icon={LockIcon}
                            color={theme.palette.success.main}
                        />
                    )}
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Overall PnL"
                            value={formatCurrency(analytics?.overall_pnl)}
                            subtitle="From closed positions"
                            icon={ChartIcon}
                            color={
                                parseFloat(analytics?.overall_pnl || 0) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                            }
                        />
                    )}
                </Grid>
            </Grid>

            {/* PnL Detail Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Open Trades PnL"
                            value={formatCurrency(totalOpenTradesPnL)}
                            subtitle="Realized PnL from open trade legs"
                            icon={TrendingUpIcon}
                            color={
                                totalOpenTradesPnL >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                            }
                        />
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {loading ? (
                        <StatCardSkeleton />
                    ) : (
                        <StatCard
                            title="Closed Trades PnL"
                            value={formatCurrency(analytics?.closed_trades_pnl)}
                            subtitle="PnL from fully closed trades"
                            icon={TrendingDownIcon}
                            color={
                                parseFloat(analytics?.closed_trades_pnl || 0) >= 0
                                    ? theme.palette.success.main
                                    : theme.palette.error.main
                            }
                        />
                    )}
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                {/* PnL Over Time Chart */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%', p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                PnL Over Time
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Monthly profit and loss from closed positions
                            </Typography>

                            {loading ? (
                                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                            ) : lineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                            axisLine={{ stroke: theme.palette.divider }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                            axisLine={{ stroke: theme.palette.divider }}
                                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                                        />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="pnl"
                                            stroke={theme.palette.primary.main}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: theme.palette.primary.main }}
                                            activeDot={{ r: 6, fill: theme.palette.primary.main }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box
                                    sx={{
                                        height: 280,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'text.secondary',
                                    }}
                                >
                                    <Typography>No PnL data available yet</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Trade Distribution Pie Chart */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%', p: 3 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Trade Status
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Distribution of open vs closed trades
                            </Typography>

                            {loading ? (
                                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                            ) : pieData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [value, name]}
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                borderRadius: 8,
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => (
                                                <span style={{ color: theme.palette.text.primary, fontSize: 14 }}>
                                                    {value}
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box
                                    sx={{
                                        height: 280,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'text.secondary',
                                    }}
                                >
                                    <Typography>No trade data available</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Analysis;
