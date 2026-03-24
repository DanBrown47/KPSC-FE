import { createTheme } from '@mui/material/styles';

const colors = {
  navy: '#0F1F3D',
  navyLight: '#1A3158',
  navyDark: '#091628',
  blue: '#1A4480',
  blueLight: '#2563AB',
  gold: '#F0B429',
  goldLight: '#FBBF24',
  goldDark: '#D97706',
  // Status colors
  draft: '#6B7280',
  draftBg: '#F3F4F6',
  pending: '#D97706',
  pendingBg: '#FFFBEB',
  approved: '#059669',
  approvedBg: '#ECFDF5',
  rejected: '#DC2626',
  rejectedBg: '#FEF2F2',
  consolidated: '#7C3AED',
  consolidatedBg: '#F5F3FF',
  finalized: '#0F1F3D',
  finalizedBg: '#EFF6FF',
  voted: '#0891B2',
  votedBg: '#ECFEFF',
  decided: '#065F46',
  decidedBg: '#ECFDF5',
  archived: '#374151',
  archivedBg: '#F9FAFB',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.blue,
      dark: colors.navy,
      light: colors.blueLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.gold,
      dark: colors.goldDark,
      light: colors.goldLight,
      contrastText: colors.navy,
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    success: { main: '#059669' },
    info: { main: '#0891B2' },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, color: colors.navy },
    h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, color: colors.navy },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.9375rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 40,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeLarge: { minHeight: 48, padding: '12px 24px' },
        sizeSmall: { minHeight: 32 },
        containedPrimary: {
          backgroundColor: colors.blue,
          '&:hover': { backgroundColor: colors.navyLight },
        },
        containedSecondary: {
          backgroundColor: colors.gold,
          color: colors.navy,
          '&:hover': { backgroundColor: colors.goldDark },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#F1F5F9',
          color: colors.navy,
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
        root: { borderColor: '#E2E8F0' },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F1F5F9',
            borderBottom: '2px solid #E2E8F0',
          },
          '& .MuiDataGrid-row': {
            minHeight: '56px !important',
            '&:hover': { backgroundColor: '#F8FAFC' },
          },
          '& .MuiDataGrid-cell': {
            borderColor: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            minHeight: 44,
            '& fieldset': { borderColor: '#CBD5E1' },
            '&:hover fieldset': { borderColor: colors.blue },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.navy,
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.3)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 48,
          marginBottom: 2,
          '&.Mui-selected': {
            backgroundColor: colors.navyLight,
            borderLeft: `3px solid ${colors.gold}`,
            '&:hover': { backgroundColor: colors.navyLight },
          },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.8125rem', backgroundColor: '#1E293B' },
      },
    },
  },
});

export { colors };
