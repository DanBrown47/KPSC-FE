import { createSlice } from '@reduxjs/toolkit';

// Derive menu permissions from global_role (no backend endpoint needed)
export const deriveMenuPermissions = (user) => {
  if (!user) return null;
  const role = user.global_role;
  const agendaRoles = ['WING_MEMBER', 'WING_ASJS', 'WING_AS', 'WING_JS', 'WING_HEAD', 'RNA_ASJS', 'CHAIRMAN_PS', 'CHAIRMAN', 'MEMBER', 'MEMBER_PA', 'SECRETARY', 'SECRETARY_PA', 'CA', 'RA_WING'];
  const wingRoles = ['WING_AS', 'WING_JS', 'WING_ASJS', 'WING_MEMBER', 'WING_HEAD', 'CA', 'RA_WING', 'RNA_ASJS'];
  // wing_switcher: visible when user has multiple wing assignments (derived at runtime from wing_roles length)
  const hasMultipleWings = Array.isArray(user.wing_roles) && user.wing_roles.filter((r) => r.is_active).length > 1;
  return {
    meeting_viewer: role !== 'WEB_ADMIN',
    agenda_viewer: agendaRoles.includes(role),
    approver: ['WING_ASJS', 'WING_AS', 'WING_JS', 'WING_HEAD', 'RNA_ASJS'].includes(role),
    consolidator: role === 'RNA_ASJS',
    report_viewer: ['CHAIRMAN_PS', 'RNA_ASJS', 'CHAIRMAN', 'SECRETARY'].includes(role),
    user_manager: role === 'WEB_ADMIN',
    config_manager: role === 'WEB_ADMIN',
    audit_viewer: ['WEB_ADMIN', 'CHAIRMAN_PS'].includes(role),
    wing_switcher: wingRoles.includes(role) && hasMultipleWings,
  };
};

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('kpsc_token');
    const refreshToken = localStorage.getItem('kpsc_refresh_token');
    const user = JSON.parse(localStorage.getItem('kpsc_user') || 'null');
    const menuPermissions = JSON.parse(localStorage.getItem('kpsc_menu_permissions') || 'null');
    return { token, refreshToken, user, menuPermissions };
  } catch {
    return { token: null, refreshToken: null, user: null, menuPermissions: null };
  }
};

const initialState = {
  ...getStoredAuth(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, refreshToken, user, menuPermissions } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken ?? state.refreshToken;
      state.user = user;
      state.menuPermissions = menuPermissions ?? state.menuPermissions;
      localStorage.setItem('kpsc_token', token);
      if (refreshToken) localStorage.setItem('kpsc_refresh_token', refreshToken);
      if (user) localStorage.setItem('kpsc_user', JSON.stringify(user));
      if (menuPermissions) localStorage.setItem('kpsc_menu_permissions', JSON.stringify(menuPermissions));
    },
    updateToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('kpsc_token', action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.menuPermissions = null;
      localStorage.removeItem('kpsc_token');
      localStorage.removeItem('kpsc_refresh_token');
      localStorage.removeItem('kpsc_user');
      localStorage.removeItem('kpsc_menu_permissions');
    },
  },
});

export const { setCredentials, updateToken, logout } = authSlice.actions;

export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
// global_role is a top-level field on UserProfile serializer
export const selectGlobalRole = (state) => state.auth.user?.global_role;
// If no stored menuPermissions, derive from user role
export const selectMenuPermissions = (state) =>
  state.auth.menuPermissions ?? deriveMenuPermissions(state.auth.user);
export const selectToken = (state) => state.auth.token;

export default authSlice.reducer;
