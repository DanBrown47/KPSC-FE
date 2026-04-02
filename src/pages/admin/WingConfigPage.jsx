import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  useGetWingsQuery,
  useUpdateWingPriorityMutation,
  useCreateWingMutation,
  useUpdateWingMutation,
  useGetAgendaFormsQuery,
  useUpdateWingAgendaFormsMutation,
} from '../../store/api/wingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const EMPTY_FORM = { name: '', code: '', priority_order: '', is_active: true, file_prefix: '', attachment_size_limit_mb: '' };

const CreateWingDrawer = ({ open, nextPriority, onClose }) => {
  const dispatch = useDispatch();
  const [createWing, { isLoading: saving }] = useCreateWingMutation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, priority_order: String(nextPriority) });
      setErrors({});
    }
  }, [open, nextPriority]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.priority_order || !/^\d+$/.test(form.priority_order))
      errs.priority_order = 'Must be a positive integer';
    if (form.attachment_size_limit_mb !== '' && !/^\d+$/.test(form.attachment_size_limit_mb))
      errs.attachment_size_limit_mb = 'Must be a positive integer';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await createWing({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        priority_order: Number(form.priority_order),
        is_active: form.is_active,
        file_prefix: form.file_prefix.trim(),
        attachment_size_limit_mb: form.attachment_size_limit_mb === '' ? null : Number(form.attachment_size_limit_mb),
      }).unwrap();
      dispatch(showToast({ message: `Wing "${form.name.trim()}" created`, severity: 'success' }));
      onClose();
    } catch (err) {
      const detail = err?.data?.code?.[0] || err?.data?.detail || 'Failed to create wing';
      dispatch(showToast({ message: detail, severity: 'error' }));
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>New Wing</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a new wing with its configuration.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
          <TextField
            label="Wing Name"
            value={form.name}
            onChange={set('name')}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          <TextField
            label="Code"
            value={form.code}
            onChange={set('code')}
            inputProps={{ style: { textTransform: 'uppercase' } }}
            error={Boolean(errors.code)}
            helperText={errors.code || 'Short unique identifier, e.g. GEN'}
            required
          />
          <TextField
            label="Priority Order"
            value={form.priority_order}
            onChange={(e) => {
              if (e.target.value === '' || /^\d+$/.test(e.target.value))
                setForm((f) => ({ ...f, priority_order: e.target.value }));
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            error={Boolean(errors.priority_order)}
            helperText={errors.priority_order || 'Lower number = higher priority'}
            required
          />
          <TextField
            label="File Prefix"
            value={form.file_prefix}
            onChange={set('file_prefix')}
            placeholder="e.g. GR or A2,A3,A5"
            helperText="Comma-separated file serial number prefix(es)"
          />
          <TextField
            label="Attachment Size Limit"
            value={form.attachment_size_limit_mb}
            onChange={(e) => {
              if (e.target.value === '' || /^\d+$/.test(e.target.value))
                setForm((f) => ({ ...f, attachment_size_limit_mb: e.target.value }));
            }}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{ endAdornment: <InputAdornment position="end">MB</InputAdornment> }}
            error={Boolean(errors.attachment_size_limit_mb)}
            helperText={errors.attachment_size_limit_mb || 'Leave blank for system default'}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} fullWidth>
            {saving ? 'Saving…' : 'Create Wing'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

const WingSettingsDrawer = ({ open, wing, agendaForms, onClose }) => {
  const dispatch = useDispatch();
  const [updateWing] = useUpdateWingMutation();
  const [updateWingAgendaForms] = useUpdateWingAgendaFormsMutation();

  const [attachmentLimit, setAttachmentLimit] = useState('');
  const [filePrefix, setFilePrefix] = useState('');
  const [selectedForms, setSelectedForms] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (wing) {
      setAttachmentLimit(wing.attachment_size_limit_mb ?? '');
      setFilePrefix(wing.file_prefix ?? '');
      setSelectedForms(wing.assigned_forms || []);
    }
  }, [wing]);

  const handleLimitChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) setAttachmentLimit(val);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateWing({
          id: wing.id,
          file_prefix: filePrefix.trim(),
          attachment_size_limit_mb: attachmentLimit === '' ? null : Number(attachmentLimit),
        }).unwrap(),
        updateWingAgendaForms({
          wingId: wing.id,
          agenda_form_ids: selectedForms.map((f) => f.id),
        }).unwrap(),
      ]);
      dispatch(showToast({ message: `${wing.name} settings saved`, severity: 'success' }));
      onClose();
    } catch {
      dispatch(showToast({ message: `Failed to save ${wing.name} settings`, severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>{wing?.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{wing?.code}</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <TextField
            label="File Prefix"
            value={filePrefix}
            onChange={(e) => setFilePrefix(e.target.value)}
            placeholder="e.g. GR or A2,A3,A5"
            helperText="Comma-separated file serial number prefix(es) for this wing"
          />

          <Autocomplete
            multiple
            options={agendaForms}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            value={selectedForms}
            onChange={(_, value) => setSelectedForms(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip key={option.id} label={option.code} size="small" {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assigned Agenda Forms"
                placeholder={selectedForms.length === 0 ? 'Select forms…' : ''}
              />
            )}
          />

          <TextField
            label="Attachment Size Limit"
            value={attachmentLimit}
            onChange={handleLimitChange}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{
              endAdornment: <InputAdornment position="end">MB</InputAdornment>,
            }}
            placeholder="Leave blank for system default"
            helperText="Maximum file size per attachment for this wing"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} fullWidth>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export const WingConfigPage = () => {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetWingsQuery();
  const { data: agendaFormsData, isLoading: formsLoading } = useGetAgendaFormsQuery();
  const [updatePriority, { isLoading: saving }] = useUpdateWingPriorityMutation();

  const [wings, setWings] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [drawerWing, setDrawerWing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const agendaForms = Array.isArray(agendaFormsData?.results) ? agendaFormsData.results : Array.isArray(agendaFormsData) ? agendaFormsData : [];

  useEffect(() => {
    if (data) {
      const sorted = [...(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])].sort(
        (a, b) => (a.priority_order || 0) - (b.priority_order || 0)
      );
      setWings(sorted);
    }
  }, [data]);

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(wings);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setWings(reordered);
    setIsDirty(true);
  };

  const handleSaveOrder = async () => {
    try {
      const payload = wings.map((w, i) => ({ id: w.id, priority_order: i + 1 }));
      await updatePriority(payload).unwrap();
      dispatch(showToast({ message: 'Wing order saved', severity: 'success' }));
      setIsDirty(false);
    } catch {
      dispatch(showToast({ message: 'Failed to save wing order', severity: 'error' }));
    }
  };

  const columns = [
    {
      field: 'priority_order',
      headerName: 'Priority',
      width: 90,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{ bgcolor: '#0F1F3D', color: '#fff', fontWeight: 700, minWidth: 32 }}
        />
      ),
    },
    { field: 'name', headerName: 'Wing Name', flex: 1, minWidth: 160 },
    { field: 'code', headerName: 'Code', width: 110 },
    {
      field: 'file_prefix',
      headerName: 'File Prefix',
      width: 130,
      renderCell: ({ value }) =>
        value ? (
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{value}</Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'assigned_forms',
      headerName: 'Assigned Agenda Forms',
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ value }) =>
        value && value.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
            {value.map((f) => (
              <Chip key={f.id} label={f.code} size="small" variant="outlined" />
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">None assigned</Typography>
        ),
    },
    {
      field: 'attachment_size_limit_mb',
      headerName: 'Attachment Limit',
      width: 150,
      renderCell: ({ value }) =>
        value != null ? (
          <Chip label={`${value} MB`} size="small" variant="outlined" />
        ) : (
          <Typography variant="caption" color="text.disabled">System default</Typography>
        ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 64,
      sortable: false,
      renderCell: ({ row }) => (
        <IconButton size="small" onClick={() => setDrawerWing(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (isLoading || formsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Wing Configuration"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Wing Configuration' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Add Wing
          </Button>
        }
      />

      {/* ── Priority Order ── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Priority Order</Typography>
          <Button variant="contained" onClick={handleSaveOrder} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save Order'}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag wings to reorder their priority. Lower position = higher priority in agenda ordering.
        </Typography>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="wings">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {wings.map((wing, index) => (
                  <Draggable key={wing.id} draggableId={String(wing.id)} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 1,
                          opacity: snapshot.isDragging ? 0.85 : 1,
                          boxShadow: snapshot.isDragging ? 4 : 1,
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box {...provided.dragHandleProps} sx={{ color: 'text.disabled', cursor: 'grab', display: 'flex' }}>
                            <DragIndicatorIcon />
                          </Box>
                          <Chip
                            label={index + 1}
                            size="small"
                            sx={{ bgcolor: '#0F1F3D', color: '#fff', fontWeight: 700, minWidth: 32 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2">{wing.name}</Typography>
                            {wing.code && (
                              <Typography variant="caption" color="text.secondary">{wing.code}</Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Priority {index + 1}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* ── Wings Table ── */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Wings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the edit icon to assign agenda forms and configure attachment size limits per wing.
        </Typography>

        <DataGrid
          rows={wings}
          columns={columns}
          rowCount={wings.length}
          disableRowSelectionOnClick
          autoHeight
          hideFooter={wings.length <= 25}
          getRowHeight={() => 'auto'}
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      <CreateWingDrawer
        open={createOpen}
        nextPriority={wings.length > 0 ? Math.max(...wings.map((w) => w.priority_order || 0)) + 1 : 1}
        onClose={() => setCreateOpen(false)}
      />

      <WingSettingsDrawer
        open={Boolean(drawerWing)}
        wing={drawerWing}
        agendaForms={agendaForms}
        onClose={() => setDrawerWing(null)}
      />
    </Box>
  );
};
