/**
 * Custom MUI Theme for AurumIQ
 * 
 * Premium, minimal design with professional color palette.
 * Uses Inter font family for clean typography.
 */

import { createTheme, alpha } from '@mui/material/styles';

// Color palette
const colors = {
    primary: {
        main: '#1a237e',      // Deep indigo
        light: '#534bae',
        dark: '#000051',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#00796b',      // Teal
        light: '#48a999',
        dark: '#004c40',
        contrastText: '#ffffff',
    },
    success: {
        main: '#2e7d32',      // Forest green
        light: '#4caf50',
        dark: '#1b5e20',
    },
    error: {
        main: '#c62828',      // Deep red
        light: '#ef5350',
        dark: '#8e0000',
    },
    warning: {
        main: '#f57c00',
        light: '#ffb74d',
        dark: '#e65100',
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },
};

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        grey: colors.grey,
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        text: {
            primary: colors.grey[900],
            secondary: colors.grey[600],
        },
        divider: alpha(colors.grey[500], 0.12),
    },

    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,

        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
        },
    },

    shape: {
        borderRadius: 8,
    },

    shadows: [
        'none',
        '0px 1px 2px rgba(0, 0, 0, 0.05)',
        '0px 1px 3px rgba(0, 0, 0, 0.08)',
        '0px 2px 4px rgba(0, 0, 0, 0.08)',
        '0px 4px 6px rgba(0, 0, 0, 0.08)',
        '0px 6px 8px rgba(0, 0, 0, 0.08)',
        '0px 8px 12px rgba(0, 0, 0, 0.1)',
        '0px 10px 16px rgba(0, 0, 0, 0.1)',
        '0px 12px 20px rgba(0, 0, 0, 0.1)',
        '0px 14px 24px rgba(0, 0, 0, 0.12)',
        '0px 16px 28px rgba(0, 0, 0, 0.12)',
        '0px 18px 32px rgba(0, 0, 0, 0.14)',
        '0px 20px 36px rgba(0, 0, 0, 0.14)',
        '0px 22px 40px rgba(0, 0, 0, 0.16)',
        '0px 24px 44px rgba(0, 0, 0, 0.16)',
        '0px 26px 48px rgba(0, 0, 0, 0.18)',
        '0px 28px 52px rgba(0, 0, 0, 0.18)',
        '0px 30px 56px rgba(0, 0, 0, 0.2)',
        '0px 32px 60px rgba(0, 0, 0, 0.2)',
        '0px 34px 64px rgba(0, 0, 0, 0.22)',
        '0px 36px 68px rgba(0, 0, 0, 0.22)',
        '0px 38px 72px rgba(0, 0, 0, 0.24)',
        '0px 40px 76px rgba(0, 0, 0, 0.24)',
        '0px 42px 80px rgba(0, 0, 0, 0.26)',
        '0px 44px 84px rgba(0, 0, 0, 0.26)',
    ],

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 500,
                    boxShadow: 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0px 6px 12px rgba(26, 35, 126, 0.25)',
                    },
                },
                outlined: {
                    borderWidth: 1.5,
                    '&:hover': {
                        borderWidth: 1.5,
                        backgroundColor: alpha(colors.primary.main, 0.04),
                    },
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                rounded: {
                    borderRadius: 12,
                },
                elevation1: {
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
                },
            },
        },

        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '16px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: colors.grey[50],
                    color: colors.grey[700],
                },
            },
        },

        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: alpha(colors.primary.main, 0.02),
                    },
                },
            },
        },

        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    borderRadius: 6,
                },
            },
        },

        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        transition: 'box-shadow 0.2s ease',
                        '&.Mui-focused': {
                            boxShadow: `0 0 0 3px ${alpha(colors.primary.main, 0.1)}`,
                        },
                    },
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.16)',
                },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: 'none',
                    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
                },
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '2px 8px',
                    transition: 'all 0.15s ease',
                    '&.Mui-selected': {
                        backgroundColor: alpha(colors.primary.main, 0.15),
                        color: colors.primary.main,
                        '&:hover': {
                            backgroundColor: alpha(colors.primary.main, 0.22),
                        },
                        '& .MuiListItemIcon-root': {
                            color: colors.primary.main,
                        },
                    },
                    '&:hover': {
                        backgroundColor: alpha(colors.primary.main, 0.04),
                    },
                },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(8px)',
                    backgroundColor: alpha('#ffffff', 0.9),
                },
            },
        },

        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: colors.grey[800],
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: 6,
                    padding: '8px 12px',
                },
            },
        },

        MuiSkeleton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});

export default theme;
