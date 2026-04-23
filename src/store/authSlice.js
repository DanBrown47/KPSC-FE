import { createSlice } from '@reduxjs/toolkit';

// Roles whose sidebar permissions are driven by wing-level UserPermissionRole assignments,
// not by global_role alone. Any role in this set must have an active wing with explicit
// permission_roles for the sidebar to show agenda/approval tabs.
const WING_SCOPED_ROLES = new Set([
  'WING_MEMBER', 'WING_ASJS', 'WING_AS', 'WING_JS', 'WING_HEAD', 'CA', 'RA_WING',
]);

// Backend permission_role values that grant agenda list/detail access
const AGENDA_VIEW_PERMS = new Set([
  'agenda_item_view', 'agenda_item_create', 'agenda_item_edit',
  'agenda_item_delete', 'final_agenda_view',
]);

// Derive menu permissions from user data.
// For wing-scoped roles, permissions are read from the active wing's permission_roles
// so that a user with zero permissions in a wing sees no tabs for that wing.
export const deriveMenuPermissions = (user) => {
  if (!user) return null;
  const role = user.global_role;
  const activeWingRoles = (user.wing_roles || []).filter((r) => r.is_active !== false);
  const hasMultipleWings = activeWingRoles.length > 1;

  if (WING_SCOPED_ROLES.has(role)) {
    const activeWingId = user.active_wing_id;
    // Fall back to single wing when active_wing is not explicitly set
    const effectiveWingId = activeWingId ?? (activeWingRoles.length === 1 ? activeWingRoles[0].wing : null);
    const activeWingRole = effectiveWingId
      ? activeWingRoles.find((r) => Number(r.wing) === Number(effectiveWingId))
      : null;

    const wingPerms = new Set((activeWingRole?.permission_roles || []).map((p) => p.permission_role));
    const agendaViewer = [...AGENDA_VIEW_PERMS].some((p) => wingPerms.has(p));
    const canApprove = wingPerms.has('approve_agenda_item');
    // Show meetings/calendar only when user can do something agenda-related
    const meetingViewer = agendaViewer || wingPerms.has('meeting_convener');

    return {
      meeting_viewer: meetingViewer,
      agenda_viewer: agendaViewer,
      approver: canApprove,
      consolidator: false,
      report_viewer: false,
      user_manager: false,
      config_manager: false,
      audit_viewer: false,
      wing_switcher: hasMultipleWings,
    };
  }

  // Non-wing-scoped global roles use role-based permissions
  const agendaRoles = ['RNA_ASJS', 'CHAIRMAN_PS', 'CHAIRMAN', 'MEMBER', 'MEMBER_PA', 'SECRETARY', 'SECRETARY_PA'];
  const wingSwitcherRoles = new Set(['RNA_ASJS']);
  return {
    meeting_viewer: role !== 'WEB_ADMIN',
    agenda_viewer: agendaRoles.includes(role),
    approver: role === 'RNA_ASJS',
    consolidator: role === 'RNA_ASJS',
    report_viewer: ['CHAIRMAN_PS', 'RNA_ASJS', 'CHAIRMAN', 'SECRETARY'].includes(role),
    user_manager: role === 'WEB_ADMIN',
    config_manager: role === 'WEB_ADMIN',
    audit_viewer: ['WEB_ADMIN', 'CHAIRMAN_PS'].includes(role),
    wing_switcher: wingSwitcherRoles.has(role) && hasMultipleWings,
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
// Always derive fresh from user data so wing-scoped permission changes take effect immediately.
// Stale cached menuPermissions in localStorage are intentionally ignored.
export const selectMenuPermissions = (state) => deriveMenuPermissions(state.auth.user);
export const selectToken = (state) => state.auth.token;

export default authSlice.reducer;
