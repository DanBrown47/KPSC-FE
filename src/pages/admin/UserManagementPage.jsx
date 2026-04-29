import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import { DataGrid } from '@mui/x-data-grid';
import ListSubheader from '@mui/material/ListSubheader';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeactivateUserMutation, useActivateUserMutation, useGetWingRolesQuery, useAddWingRoleMutation, useRemoveWingRoleMutation, useGetPermissionRolesQuery, useAddPermissionRoleMutation, useRemovePermissionRoleMutation } from '../../store/api/usersApi.js';
import { useGetWingsQuery } from '../../store/api/wingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const PREDEFINED_ROLES = new Set([
  'CHAIRMAN', 'CHAIRMAN_PS', 'SECRETARY', 'MEMBER', 'MEMBER_PA', 'SECRETARY_PA',
]);

const ROLES = [
  { divider: true, label: 'Commission Roles' },
  { value: 'CHAIRMAN',     label: 'Chairman' },
  { value: 'CHAIRMAN_PS',  label: 'Chairman PS' },
  { value: 'SECRETARY',    label: 'Secretary' },
  { value: 'MEMBER',       label: 'Members' },
  { value: 'MEMBER_PA',    label: 'PA (Member)' },
  { value: 'SECRETARY_PA', label: 'PA (Secretary)' },
  { divider: true, label: 'Wing Roles' },
  { value: 'WING_AS',      label: 'AS' },
  { value: 'WING_JS',      label: 'JS' },
  { value: 'CA',           label: 'CA' },
  { divider: false },
  { value: 'WEB_ADMIN',    label: 'Web Admin' },
];

const ROLE_LABEL = Object.fromEntries(ROLES.filter((r) => r.value).map((r) => [r.value, r.label]));

const WING_ROLE_OPTIONS = [
  { value: 'AS_JS', label: 'AS/JS' },
  { value: 'WING_MEMBER', label: 'Wing Member' },
  { value: 'CA', label: 'CA' },
];

const PERMISSION_CHOICES = [
  { value: 'agenda_item_create',  label: 'Create Agenda Item' },
  { value: 'agenda_item_view',    label: 'View Agenda Item' },
  { value: 'agenda_item_edit',    label: 'Edit Agenda Item' },
  { value: 'agenda_item_delete',  label: 'Delete Agenda Item' },
  { value: 'approve_agenda_item', label: 'Approve Agenda Item' },
  { value: 'final_agenda_view',   label: 'View Final Agenda' },
];

const RA_ONLY_PERMISSION_CHOICES = [
  { value: 'finalize_other_wings_agenda',            label: 'Finalize Other Wings Agenda' },
  { value: 'add_subsequent_item_to_approved_agenda', label: 'Add Subsequent Item to Approved Agenda' },
];

const getInitials = (user) => {
  const f = user.user?.first_name?.[0] || user.full_name?.[0] || '';
  const l = user.user?.last_name?.[0] || user.full_name?.split(' ')?.[1]?.[0] || '';
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
};

const deriveWingRole = (globalRole) => {
  if (['WING_JS', 'WING_AS'].includes(globalRole)) return 'AS_JS';
  if (globalRole === 'CA') return 'CA';
  return 'WING_MEMBER';
};

const WingAssignmentsTab = ({ userId, globalRole }) => {
  const dispatch = useDispatch();
  const [newWing, setNewWing] = useState('');
  const [newRole, setNewRole] = useState(() => deriveWingRole(globalRole));
  const { data: wingRolesData } = useGetWingRolesQuery(userId);
  const { data: wingsData } = useGetWingsQuery({ is_active: true, page_size: 200 });
  const [addWingRole] = useAddWingRoleMutation();
  const [removeWingRole] = useRemoveWingRoleMutation();
  const wingRoles = Array.isArray(wingRolesData?.results) ? wingRolesData.results : Array.isArray(wingRolesData) ? wingRolesData : [];
  const allWings = Array.isArray(wingsData?.results) ? wingsData.results : Array.isArray(wingsData) ? wingsData : [];
  const assignedWingIds = new Set(wingRoles.map((wr) => wr.wing));
  const availableWings = allWings.filter((w) => !assignedWingIds.has(w.id));

  const handleAdd = async () => {
    if (!newWing) return;
    try {
      await addWingRole({ userId, wing: newWing, wing_role: newRole, is_active: true }).unwrap();
      setNewWing('');
      dispatch(showToast({ message: 'Wing assigned', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to assign wing', severity: 'error' }));
    }
  };

  const handleRemove = async (roleId) => {
    try {
      await removeWingRole(roleId).unwrap();
      dispatch(showToast({ message: 'Wing removed', severity: 'info' }));
    } catch {
      dispatch(showToast({ message: 'Failed to remove wing', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField select label="Wing" value={newWing} onChange={(e) => setNewWing(e.target.value)} size="small" sx={{ flex: 1 }} disabled={availableWings.length === 0}>
          {availableWings.length === 0
            ? <MenuItem value="" disabled>All wings assigned</MenuItem>
            : availableWings.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)
          }
        </TextField>
        <TextField select label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} size="small" sx={{ width: 130 }}>
          {WING_ROLE_OPTIONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" onClick={handleAdd} disabled={!newWing || availableWings.length === 0} sx={{ mt: 0.5 }}>Add</Button>
      </Box>
      {wingRoles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No wing assignments yet.</Typography>
      ) : (
        wingRoles.map((wr) => (
          <Box key={wr.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>{wr.wing_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {WING_ROLE_OPTIONS.find(r => r.value === wr.wing_role)?.label || wr.wing_role}
              </Typography>
            </Box>
            <Chip label={wr.is_active ? 'Active' : 'Inactive'} size="small" sx={{ bgcolor: wr.is_active ? '#ECFDF5' : '#F3F4F6', color: wr.is_active ? '#059669' : '#6B7280' }} />
            <IconButton size="small" color="error" onClick={() => handleRemove(wr.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))
      )}
    </Box>
  );
};

const WingPermissionSection = ({ wingRole }) => {
  const dispatch = useDispatch();
  const { data: permRolesData = [], isLoading: permsLoading } = useGetPermissionRolesQuery(wingRole.id);
  const [addPermRole] = useAddPermissionRoleMutation();
  const [removePermRole] = useRemovePermissionRoleMutation();

  const permRoles = Array.isArray(permRolesData?.results) ? permRolesData.results : Array.isArray(permRolesData) ? permRolesData : [];
  const enabledPerms = new Map(permRoles.map((p) => [p.permission_role, p.id]));

  const handleToggle = async (value, checked) => {
    try {
      if (checked) {
        await addPermRole({ user_wing_role: wingRole.id, permission_role: value }).unwrap();
        dispatch(showToast({ message: 'Permission added', severity: 'success' }));
      } else {
        const permId = enabledPerms.get(value);
        if (permId) {
          await removePermRole(permId).unwrap();
          dispatch(showToast({ message: 'Permission removed', severity: 'info' }));
        }
      }
    } catch {
      dispatch(showToast({ message: 'Failed to update permission', severity: 'error' }));
    }
  };

  const visiblePerms = wingRole.wing_code === 'RA'
    ? [...PERMISSION_CHOICES, ...RA_ONLY_PERMISSION_CHOICES]
    : PERMISSION_CHOICES;

  return (
    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 1, p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{wingRole.wing_name}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {visiblePerms.map((p) => (
          <FormControlLabel
            key={p.value}
            control={
              <Checkbox
                size="small"
                checked={enabledPerms.has(p.value)}
                onChange={(e) => handleToggle(p.value, e.target.checked)}
                disabled={permsLoading}
              />
            }
            label={<Typography variant="body2">{p.label}</Typography>}
          />
        ))}
      </Box>
    </Box>
  );
};

const PredefinedRoleInfoPanel = ({ globalRole }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 1.5, py: 4, px: 2, textAlign: 'center',
    bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid #E2E8F0',
  }}>
    <Typography variant="subtitle2" color="text.primary">Predefined Permissions</Typography>
    <Typography variant="body2" color="text.secondary">
      The <strong>{ROLE_LABEL[globalRole] || globalRole}</strong> role has
      fixed, system-defined permissions. No wing assignment or per-wing
      configuration is required.
    </Typography>
  </Box>
);

const PermissionRolesTab = ({ userId, globalRole }) => {
  const { data: wingRolesData } = useGetWingRolesQuery(userId);
  const wingRoles = Array.isArray(wingRolesData?.results) ? wingRolesData.results : Array.isArray(wingRolesData) ? wingRolesData : [];

  if (PREDEFINED_ROLES.has(globalRole)) {
    return <PredefinedRoleInfoPanel globalRole={globalRole} />;
  }

  if (wingRoles.length === 0) {
    return <Typography variant="body2" color="text.secondary">Assign wing roles on the previous tab first.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {wingRoles.map((wr) => (
        <WingPermissionSection key={wr.id} wingRole={wr} />
      ))}
    </Box>
  );
};

const PA_ROLES = { MEMBER_PA: 'MEMBER', SECRETARY_PA: 'SECRETARY' };

const initForm = (u) => u ? {
  first_name: u.user?.first_name || '',
  last_name: u.user?.last_name || '',
  username: u.username || u.user?.username || '',
  email: u.email || u.user?.email || '',
  global_role: u.global_role || 'WING_AS',
  phone: u.phone || '',
  password: '',
  corresponding_user: u.corresponding_user_id || '',
} : { username: '', email: '', first_name: '', last_name: '', global_role: 'WING_AS', password: '', phone: '', corresponding_user: '' };

const UserDrawer = ({ open, user, onClose, onSave }) => {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(initForm(user));
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initForm(user));
      setTab(0);
      setPhoneError('');
    }
  }, [user, open]);

  const handleField = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const isNew = !user;
  const isPredefined = !isNew && PREDEFINED_ROLES.has(user?.global_role);

  const correspondingRole = PA_ROLES[form.global_role];
  const { data: correspondingUsersData } = useGetUsersQuery(
    correspondingRole ? { global_role: correspondingRole, is_active: 'true', page_size: 200 } : undefined,
    { skip: !correspondingRole }
  );
  const correspondingUsers = Array.isArray(correspondingUsersData?.results)
    ? correspondingUsersData.results
    : Array.isArray(correspondingUsersData) ? correspondingUsersData : [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>{isNew ? 'Add User' : 'Edit User'}</Typography>
        {!isNew && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Tab label="Profile" />
            {!isPredefined && <Tab label="Wing Assignments" />}
            {!isPredefined && <Tab label="Permission Roles" />}
          </Tabs>
        )}
        {(isNew || tab === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <TextField label="First Name" value={form.first_name} onChange={handleField('first_name')} required />
            <TextField label="Last Name" value={form.last_name} onChange={handleField('last_name')} required />
            <TextField label="Username" value={form.username} onChange={handleField('username')} required />
            <TextField label="Email" type="email" value={form.email} onChange={handleField('email')} required />
            <TextField select label="Role" value={form.global_role} onChange={(e) => {
              setForm((p) => ({ ...p, global_role: e.target.value, corresponding_user: '' }));
            }} required>
              {ROLES.map((r) =>
                r.divider
                  ? <ListSubheader key={r.label}>{r.label}</ListSubheader>
                  : r.value == null
                    ? null
                    : <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              )}
            </TextField>
            {correspondingRole && (
              <TextField
                select
                label={`Corresponding ${correspondingRole === 'MEMBER' ? 'Member' : 'Secretary'}`}
                value={form.corresponding_user}
                onChange={handleField('corresponding_user')}
                required
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {correspondingUsers.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.full_name || `${u.user?.first_name || ''} ${u.user?.last_name || ''}`.trim() || u.username}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => {
                handleField('phone')(e);
                const val = e.target.value;
                if (val && !/^\d{10}$/.test(val)) {
                  setPhoneError('Phone number must be exactly 10 digits');
                } else {
                  setPhoneError('');
                }
              }}
              error={!!phoneError}
              helperText={phoneError}
              inputProps={{ maxLength: 10 }}
            />
            {isNew && (
              <TextField label="Password" type="password" value={form.password} onChange={handleField('password')} required />
            )}
          </Box>
        )}
        {!isNew && !isPredefined && tab === 1 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <WingAssignmentsTab userId={user.id} globalRole={user.global_role} />
          </Box>
        )}
        {!isNew && !isPredefined && tab === 2 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <PermissionRolesTab userId={user.id} globalRole={user.global_role} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          {(isNew || tab === 0) && (
            <Button variant="contained" onClick={() => { if (!phoneError) onSave(form); }} fullWidth disabled={!!phoneError}>Save</Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export const UserManagementPage = () => {
  const dispatch = useDispatch();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, user: null });
  const [filters, setFilters] = useState({ search: '', global_role: '', is_active: '' });

  const handleFilterChange = useCallback((field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: '' }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const queryParams = {
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    ...(filters.search && { search: filters.search }),
    ...(filters.global_role && { global_role: filters.global_role }),
    ...(filters.is_active !== '' && { is_active: filters.is_active }),
  };

  const { data, isLoading } = useGetUsersQuery(queryParams);
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();

  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const rowCount = data?.count || rows.length;

  const handleSave = async (form) => {
    try {
      const payload = { ...form };
      if (!payload.corresponding_user) payload.corresponding_user = null;
      if (editUser) {
        await updateUser({ id: editUser.id, ...payload }).unwrap();
        dispatch(showToast({ message: 'User updated', severity: 'success' }));
      } else {
        await createUser(payload).unwrap();
        dispatch(showToast({ message: 'User created', severity: 'success' }));
      }
      setDrawerOpen(false);
      setEditUser(null);
    } catch {
      dispatch(showToast({ message: 'Failed to save user', severity: 'error' }));
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id).unwrap();
        dispatch(showToast({ message: 'User deactivated', severity: 'info' }));
      } else {
        await activateUser(user.id).unwrap();
        dispatch(showToast({ message: 'User activated', severity: 'success' }));
      }
    } catch {
      dispatch(showToast({ message: 'Failed to update user status', severity: 'error' }));
    }
    setDeactivateDialog({ open: false, user: null });
  };

  const columns = [
    {
      field: 'avatar',
      headerName: '',
      width: 56,
      sortable: false,
      renderCell: ({ row }) => (
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1A4480', fontSize: '0.75rem', fontWeight: 700 }}>
          {getInitials(row)}
        </Avatar>
      ),
    },
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => row.full_name || `${row.user?.first_name || ''} ${row.user?.last_name || ''}`.trim() || row.username,
    },
    { field: 'username', headerName: 'Username', width: 140 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'global_role',
      headerName: 'Role',
      width: 160,
      renderCell: ({ value }) => (
        <Chip label={ROLE_LABEL[value] || value?.replace(/_/g, ' ') || '—'} size="small" variant="outlined" />
      ),
    },
    {
      field: 'wing',
      headerName: 'Wing',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => {
        const wings = Array.isArray(row.wing_roles) ? row.wing_roles.filter((wr) => wr.is_active) : [];
        if (wings.length === 0) return <Typography variant="body2" color="text.secondary">—</Typography>;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
            {wings.map((wr) => (
              <Chip key={wr.id} label={wr.wing_name} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'permission_role',
      headerName: 'Permission Role',
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => {
        const allPerms = Array.isArray(row.wing_roles)
          ? [...new Set(row.wing_roles.flatMap((wr) => (wr.permission_roles || []).map((pr) => pr.permission_role)))]
          : [];
        if (allPerms.length === 0) return <Typography variant="body2" color="text.secondary">—</Typography>;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
            {allPerms.map((perm) => (
              <Chip
                key={perm}
                label={PERMISSION_CHOICES.find((p) => p.value === perm)?.label || perm.replace(/_/g, ' ')}
                size="small"
                sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: ({ value }) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          sx={{ bgcolor: value ? '#ECFDF5' : '#F3F4F6', color: value ? '#059669' : '#6B7280', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => { setEditUser(row); setDrawerOpen(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setDeactivateDialog({ open: true, user: row })} color={row.is_active ? 'error' : 'success'}>
            {row.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="User Management"
        breadcrumbs={[{ label: 'Admin' }, { label: 'User Management' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditUser(null); setDrawerOpen(true); }}>
            Add User
          </Button>
        }
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search name, username, email…"
          value={filters.search}
          onChange={handleFilterChange('search')}
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <TextField
          select
          label="Role"
          value={filters.global_role}
          onChange={handleFilterChange('global_role')}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          {ROLES.map((r) =>
            r.divider
              ? <ListSubheader key={r.label}>{r.label}</ListSubheader>
              : r.value == null
                ? null
                : <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          )}
        </TextField>
        <TextField
          select
          label="Status"
          value={filters.is_active}
          onChange={handleFilterChange('is_active')}
          size="small"
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={isLoading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        autoHeight
        getRowHeight={() => 'auto'}
        sx={{ bgcolor: 'background.paper' }}
      />
      <UserDrawer
        open={drawerOpen}
        user={editUser}
        onClose={() => { setDrawerOpen(false); setEditUser(null); }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={deactivateDialog.open}
        onClose={() => setDeactivateDialog({ open: false, user: null })}
        onConfirm={() => handleToggleStatus(deactivateDialog.user)}
        title={deactivateDialog.user?.is_active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${deactivateDialog.user?.is_active ? 'deactivate' : 'activate'} ${deactivateDialog.user?.username}?`}
        variant="consequential"
        confirmLabel={deactivateDialog.user?.is_active ? 'Deactivate' : 'Activate'}
      />
    </Box>
  );
};
