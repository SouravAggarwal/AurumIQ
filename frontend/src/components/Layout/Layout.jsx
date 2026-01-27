/**
 * Main Layout Component
 * 
 * Provides the application shell with:
 * - Collapsible left sidebar navigation
 * - Top app bar with title
 * - Main content area with smooth transitions
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    useTheme,
    useMediaQuery,
    Divider,
    Avatar,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Analytics as AnalyticsIcon,
    TrendingUp as TradesIcon,
    ChevronLeft as ChevronLeftIcon,
    Settings as SettingsIcon,
    CameraAlt as SnapshotIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const navigationItems = [
    { path: '/analysis', label: 'Analysis', icon: AnalyticsIcon },
    { path: '/trades', label: 'Trades', icon: TradesIcon },
    { path: '/snapshots', label: 'Snapshots', icon: SnapshotIcon },
];

function Layout({ children }) {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
    };

    const isActive = (path) => {
        if (path === '/trades') {
            return location.pathname.startsWith('/trades');
        }
        if (path === '/snapshots') {
            return location.pathname.startsWith('/snapshots');
        }
        return location.pathname === path;
    };

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
            }}
        >
            {/* Logo Section */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: drawerOpen ? 'space-between' : 'center',
                    p: 2,
                    minHeight: 64,
                }}
            >
                {drawerOpen && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                fontSize: '1rem',
                                fontWeight: 700,
                            }}
                        >
                            A
                        </Avatar>
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    lineHeight: 1.2,
                                }}
                            >
                                AurumIQ
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', display: 'block', mt: -0.5 }}
                            >
                                Trading Platform
                            </Typography>
                        </Box>
                    </Box>
                )}
                {!isMobile && (
                    <IconButton
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        size="small"
                        sx={{
                            transition: 'transform 0.2s',
                            transform: drawerOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Box>

            <Divider sx={{ mx: 2 }} />

            {/* Navigation Items */}
            <List sx={{ flex: 1, pt: 2 }}>
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <ListItemButton
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            selected={active}
                            sx={{
                                mx: 1,
                                mb: 0.5,
                                borderRadius: 2,
                                justifyContent: drawerOpen ? 'initial' : 'center',
                                px: drawerOpen ? 2 : 1,
                                minHeight: 48,
                                ...(active && {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'inherit',
                                    },
                                }),
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: drawerOpen ? 40 : 'auto',
                                    justifyContent: 'center',
                                    color: active ? 'inherit' : 'text.secondary',
                                }}
                            >
                                <Icon />
                            </ListItemIcon>
                            {drawerOpen && (
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 600 : 500,
                                        fontSize: '0.95rem',
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            {/* Settings Item */}
            <List sx={{ pt: 0 }}>
                <ListItemButton
                    onClick={() => handleNavigation('/settings')}
                    selected={isActive('/settings')}
                    sx={{
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2,
                        justifyContent: drawerOpen ? 'initial' : 'center',
                        px: drawerOpen ? 2 : 1,
                        minHeight: 48,
                        ...(isActive('/settings') && {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                            '& .MuiListItemIcon-root': {
                                color: 'inherit',
                            },
                        }),
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: drawerOpen ? 40 : 'auto',
                            justifyContent: 'center',
                            color: isActive('/settings') ? 'inherit' : 'text.secondary',
                        }}
                    >
                        <SettingsIcon />
                    </ListItemIcon>
                    {drawerOpen && (
                        <ListItemText
                            primary="Settings"
                            primaryTypographyProps={{
                                fontWeight: isActive('/settings') ? 600 : 500,
                                fontSize: '0.95rem',
                            }}
                        />
                    )}
                </ListItemButton>
            </List>

            {/* Footer */}
            <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                {drawerOpen && (
                    <Typography variant="caption" color="text.secondary">
                        © 2025 AurumIQ
                    </Typography>
                )}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: {
                        md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px)`,
                    },
                    ml: {
                        md: `${drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED}px`,
                    },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    backgroundColor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => setMobileDrawerOpen(true)}
                            sx={{ mr: 2, color: 'text.primary' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography
                        variant="h6"
                        noWrap
                        component="h1"
                        sx={{ color: 'text.primary', fontWeight: 600 }}
                    >
                        {navigationItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar - Desktop */}
            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                            boxSizing: 'border-box',
                            border: 'none',
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            overflowX: 'hidden',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Sidebar - Mobile */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8,
                    backgroundColor: 'background.default',
                    minHeight: '100vh',
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Box className="page-transition">{children}</Box>
            </Box>
        </Box>
    );
}

export default Layout;
