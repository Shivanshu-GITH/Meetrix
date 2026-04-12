import { createTheme } from '@mui/material/styles';

/** Meetrix — shared MUI theme (primary accent + dark surfaces) */
export const meetrixTheme = createTheme({
    palette: {
        primary: {
            main: '#FF9839',
            dark: '#e07d1f',
            light: '#ffb366',
        },
        secondary: {
            main: '#1a1a2e',
            dark: '#12121f',
        },
        background: {
            default: '#f4f6f9',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a1a2e',
            secondary: '#5c6478',
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});
