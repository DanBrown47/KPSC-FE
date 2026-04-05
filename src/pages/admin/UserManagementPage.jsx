import { useState } from 'react';
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
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeactivateUserMutation, useActivateUserMutation, useGetWingRolesQuery, useAddWingRoleMutation, useRemoveWingRoleMutation, useGetPermissionRolesQuery, useAddPermissionRoleMutation, useRemovePermissionRoleMutation } from '../../store/api/usersApi.js';
import { useGetWingsQuery } from '../../store/api/wingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const ROLES = ['WEB_ADMIN', 'CHAIRMAN_PS', 'CHAIRMAN', 'MEMBER', 'RNA_ASJS', 'WING_ASJS', 'WING_MEMBER', 'SECRETARY', 'SECRETARY_PA', 'CA', 'RA_WING'];

const WING_ROLE_OPTIONS = [
  { value: 'AS_JS', label: 'AS/JS' },
  { value: 'WING_MEMBER', label: 'Wing Member' },
  { value: 'CA', label: 'CA' },
];

const PERMISSION_CHOICES = [
  { value: 'meeting_convener', label: 'Meeting Convener' },
  { value: 'agenda_signoff_authority', label: 'Agenda Sign-off Authority' },
  { value: 'committee_agenda_approver', label: 'Committee Agenda Approver' },
  { value: 'wing_agenda_approver', label: 'Wing Agenda Approver' },
  { value: 'pre_meeting_agenda_approver', label: 'Pre-Meeting Agenda Approver' },
  { value: 'wing_user', label: 'Wing User' },
  { value: 'user_manager', label: 'User Manager' },
  { value: 'config_manager', label: 'Config Manager' },
];

const getInitials = (user) => {
  const f = user.user?.first_name?.[0] || user.full_name?.[0] || '';
  const l = user.user?.last_name?.[0] || user.full_name?.split(' ')?.[1]?.[0] || '';
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
};

const WingAssignmentsTab = ({ userId }) => {
  const dispatch = useDispatch();
  const [newWing, setNewWing] = useState('');
  const [newRole, setNewRole] = useState('WING_MEMBER');
  const { data: wingRoles = [] } = useGetWingRolesQuery(userId);
  const { data: wingsData } = useGetWingsQuery();
  const [addWingRole] = useAddWingRoleMutation();
  const [removeWingRole] = useRemoveWingRoleMutation();
  const wings = Array.isArray(wingsData?.results) ? wingsData.results : Array.isArray(wingsData) ? wingsData : [];

  const handleAdd = async () => {
    if (!newWing) return;
    try {
      await addWingRole({ userId, wing: newWing, wing_role: newRole, is_active: true }).unwrap();
      setNewWing('');
      dispatch(showToast({ message: 'Wing role added', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to add wing role', severity: 'error' }));
    }
  };

  const handleRemove = async (roleId) => {
    try {
      await removeWingRole(roleId).unwrap();
      dispatch(showToast({ message: 'Wing role removed', severity: 'info' }));
    } catch {
      dispatch(showToast({ message: 'Failed to remove wing role', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField select label="Wing" value={newWing} onChange={(e) => setNewWing(e.target.value)} size="small" sx={{ flex: 2 }}>
          {wings.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
        </TextField>
        <TextField select label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} size="small" sx={{ flex: 1 }}>
          {WING_ROLE_OPTIONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" onClick={handleAdd} disabled={!newWing} sx={{ mt: 0.5 }}>Add</Button>
      </Box>
      {wingRoles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No wing assignments yet.</Typography>
      ) : (
        wingRoles.map((wr) => (
          <Box key={wr.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>{wr.wing_name}</Typography>
              <Typography variant="caption" color="text.secondary">{wr.wing_role}</Typography>
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

const PermissionRolesTab = ({ userId }) => {
  const dispatch = useDispatch();
  const [selectedWingRoleId, setSelectedWingRoleId] = useState('');
  const [newPerm, setNewPerm] = useState('');
  const { data: wingRoles = [] } = useGetWingRolesQuery(userId);
  const { data: permRoles = [] } = useGetPermissionRolesQuery(selectedWingRoleId, { skip: !selectedWingRoleId });
  const [addPermRole] = useAddPermissionRoleMutation();
  const [removePermRole] = useRemovePermissionRoleMutation();

  const existing = permRoles.map((p) => p.permission_role);
  const available = PERMISSION_CHOICES.filter((p) => !existing.includes(p.value));

  const handleAdd = async () => {
    if (!selectedWingRoleId || !newPerm) return;
    try {
      await addPermRole({ user_wing_role: selectedWingRoleId, permission_role: newPerm }).unwrap();
      setNewPerm('');
      dispatch(showToast({ message: 'Permission role added', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to add permission role', severity: 'error' }));
    }
  };

  if (wingRoles.length === 0) {
    return <Typography variant="body2" color="text.secondary">Assign wing roles on the previous tab first.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        label="Wing Role"
        value={selectedWingRoleId}
        onChange={(e) => { setSelectedWingRoleId(e.target.value); setNewPerm(''); }}
        size="small"
        fullWidth
      >
        {wingRoles.map((wr) => (
          <MenuItem key={wr.id} value={wr.id}>{wr.wing_name} — {wr.wing_role}</MenuItem>
        ))}
      </TextField>
      {selectedWingRoleId && (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              select
              label="Permission"
              value={newPerm}
              onChange={(e) => setNewPerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              disabled={available.length === 0}
            >
              {available.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <Button variant="contained" size="small" onClick={handleAdd} disabled={!newPerm} sx={{ mt: 0.5 }}>Add</Button>
          </Box>
          {permRoles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No permission roles assigned to this wing role.</Typography>
          ) : (
            permRoles.map((pr) => (
              <Box key={pr.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {PERMISSION_CHOICES.find((p) => p.value === pr.permission_role)?.label || pr.permission_role}
                </Typography>
                <IconButton size="small" color="error" onClick={() => removePermRole(pr.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </>
      )}
    </Box>
  );
};

const UserDrawer = ({ open, user, onClose, onSave }) => {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(user || {
    username: '', email: '', first_name: '', last_name: '', global_role: 'WING_MEMBER', password: '',
  });

  const handleField = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const isNew = !user;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>{isNew ? 'Add User' : 'Edit User'}</Typography>
        {!isNew && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Tab label="Profile" />
            <Tab label="Wing Assignments" />
            <Tab label="Permission Roles" />
          </Tabs>
        )}
        {(isNew || tab === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <TextField label="First Name" value={form.first_name} onChange={handleField('first_name')} required />
            <TextField label="Last Name" value={form.last_name} onChange={handleField('last_name')} required />
            <TextField label="Username" value={form.username} onChange={handleField('username')} required />
            <TextField label="Email" type="email" value={form.email} onChange={handleField('email')} required />
            <TextField select label="Role" value={form.global_role} onChange={handleField('global_role')} required>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
              ))}
            </TextField>
            {isNew && (
              <TextField label="Password" type="password" value={form.password} onChange={handleField('password')} required />
            )}
          </Box>
        )}
        {!isNew && tab === 1 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <WingAssignmentsTab userId={user.id} />
          </Box>
        )}
        {!isNew && tab === 2 && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <PermissionRolesTab userId={user.id} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          {(isNew || tab === 0) && (
            <Button variant="contained" onClick={() => onSave(form)} fullWidth>Save</Button>
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

  const { data, isLoading } = useGetUsersQuery({
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
  });
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();

  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const rowCount = data?.count || rows.length;

  const handleSave = async (form) => {
    try {
      if (editUser) {
        await updateUser({ id: editUser.id, ...form }).unwrap();
        dispatch(showToast({ message: 'User updated', severity: 'success' }));
      } else {
        await createUser(form).unwrap();
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
        <Chip label={value?.replace(/_/g, ' ') || '—'} size="small" variant="outlined" />
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
