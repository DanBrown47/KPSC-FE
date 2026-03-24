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
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeactivateUserMutation, useActivateUserMutation } from '../../store/api/usersApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const ROLES = ['WEB_ADMIN', 'CHAIRMAN_PS', 'CHAIRMAN', 'MEMBER', 'RNA_ASJS', 'WING_ASJS', 'WING_MEMBER'];

const getInitials = (user) => {
  // UserProfileSerializer nests first_name/last_name under user.user; full_name is top-level
  const f = user.user?.first_name?.[0] || user.full_name?.[0] || '';
  const l = user.user?.last_name?.[0] || user.full_name?.split(' ')?.[1]?.[0] || '';
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">Wing role assignments would be configured here.</Typography>
          </Box>
        )}
        {!isNew && tab === 2 && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">Permission roles would be configured here.</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={() => onSave(form)} fullWidth>Save</Button>
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

  const rows = data?.results || data || [];
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
