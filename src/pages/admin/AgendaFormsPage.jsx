import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import {
  useGetAgendaFormsQuery,
  useCreateAgendaFormMutation,
  useUpdateAgendaFormMutation,
  useDeleteAgendaFormMutation,
} from '../../store/api/wingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
];

const EMPTY_FIELD = { key: '', label: '', type: 'text', required: false, bilingual: false };
const EMPTY_FORM = { name: '', code: '', description: '', is_active: true, fields: [] };

const FieldBuilderRow = ({ field, index, onChange, onDelete }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 130px 60px 80px 36px',
      gap: 1,
      alignItems: 'center',
      p: 1,
      border: '1px solid #E2E8F0',
      borderRadius: 1,
      bgcolor: '#FAFAFA',
    }}
  >
    <TextField
      size="small"
      label="Key"
      value={field.key}
      onChange={(e) => onChange(index, 'key', e.target.value.replace(/\s/g, '_').toLowerCase())}
      inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
    />
    <TextField
      size="small"
      label="Label"
      value={field.label}
      onChange={(e) => onChange(index, 'label', e.target.value)}
    />
    <FormControl size="small">
      <InputLabel>Type</InputLabel>
      <Select
        label="Type"
        value={field.type}
        onChange={(e) => onChange(index, 'type', e.target.value)}
      >
        {FIELD_TYPES.map((t) => (
          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>Req</Typography>
      <Checkbox
        size="small"
        checked={field.required}
        onChange={(e) => onChange(index, 'required', e.target.checked)}
        sx={{ p: 0.5 }}
      />
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>Bilingual</Typography>
      <Checkbox
        size="small"
        checked={field.bilingual}
        onChange={(e) => onChange(index, 'bilingual', e.target.checked)}
        sx={{ p: 0.5 }}
      />
    </Box>
    <IconButton size="small" color="error" onClick={() => onDelete(index)}>
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Box>
);

const FormDrawer = ({ open, mode, initialData, onClose }) => {
  const dispatch = useDispatch();
  const [createAgendaForm, { isLoading: creating }] = useCreateAgendaFormMutation();
  const [updateAgendaForm, { isLoading: updating }] = useUpdateAgendaFormMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const saving = creating || updating;

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setForm({
          name: initialData.name || '',
          code: initialData.code || '',
          description: initialData.description || '',
          is_active: initialData.is_active ?? true,
          fields: initialData.fields ? initialData.fields.map((f) => ({ ...EMPTY_FIELD, ...f })) : [],
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, mode, initialData]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFieldChange = (index, prop, value) => {
    setForm((f) => {
      const updated = [...f.fields];
      updated[index] = { ...updated[index], [prop]: value };
      return { ...f, fields: updated };
    });
  };

  const handleAddField = () => {
    setForm((f) => ({ ...f, fields: [...f.fields, { ...EMPTY_FIELD }] }));
  };

  const handleDeleteField = (index) => {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    const keys = form.fields.map((f) => f.key.trim()).filter(Boolean);
    const dupKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupKeys.length) errs.fields = `Duplicate field keys: ${dupKeys.join(', ')}`;
    const missingKey = form.fields.some((f) => !f.key.trim());
    const missingLabel = form.fields.some((f) => !f.label.trim());
    if (missingKey) errs.fields = (errs.fields ? errs.fields + '; ' : '') + 'All fields must have a key';
    if (missingLabel) errs.fields = (errs.fields ? errs.fields + '; ' : '') + 'All fields must have a label';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      is_active: form.is_active,
      fields: form.fields,
    };
    try {
      if (mode === 'edit') {
        await updateAgendaForm({ id: initialData.id, ...payload }).unwrap();
        dispatch(showToast({ message: `Form "${form.name.trim()}" updated`, severity: 'success' }));
      } else {
        await createAgendaForm(payload).unwrap();
        dispatch(showToast({ message: `Form "${form.name.trim()}" created`, severity: 'success' }));
      }
      onClose();
    } catch (err) {
      const detail = err?.data?.code?.[0] || err?.data?.fields?.[0] || err?.data?.detail || 'Failed to save form';
      dispatch(showToast({ message: detail, severity: 'error' }));
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 600 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          {mode === 'edit' ? 'Edit Agenda Form' : 'New Agenda Form'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {mode === 'edit'
            ? 'Modify the form definition and its fields.'
            : 'Create a reusable form template for agenda items.'}
        </Typography>

        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Form Name"
            value={form.name}
            onChange={set('name')}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          <TextField
            label="Code"
            value={form.code}
            onChange={
              mode === 'create'
                ? (e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))
                : undefined
            }
            inputProps={{ style: { textTransform: 'uppercase' } }}
            error={Boolean(errors.code)}
            helperText={errors.code || 'Unique identifier, e.g. AS_RECTT_JS_GR'}
            required
            disabled={mode === 'edit'}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={set('description')}
            multiline
            rows={2}
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

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Form Fields</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddField}>
                Add Field
              </Button>
            </Box>
            {errors.fields && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                {errors.fields}
              </Typography>
            )}
            {form.fields.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
                No fields defined. Click "Add Field" to add one.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 60px 80px 36px', gap: 1, px: 1 }}>
                  {['Key', 'Label', 'Type', 'Req', 'Bilingual', ''].map((h) => (
                    <Typography key={h} variant="caption" color="text.secondary" fontWeight={600}>{h}</Typography>
                  ))}
                </Box>
                {form.fields.map((field, i) => (
                  <FieldBuilderRow
                    key={i}
                    field={field}
                    index={i}
                    onChange={handleFieldChange}
                    onDelete={handleDeleteField}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 'auto', borderTop: '1px solid #E2E8F0' }}>
          <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} fullWidth>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Form'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export const AgendaFormsPage = () => {
  const dispatch = useDispatch();
  const { data: formsData, isLoading } = useGetAgendaFormsQuery();
  const [deleteAgendaForm] = useDeleteAgendaFormMutation();

  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, form: null });

  const forms = Array.isArray(formsData?.results)
    ? formsData.results
    : Array.isArray(formsData)
    ? formsData
    : [];

  const handleEdit = (row) => {
    setSelectedForm(row);
    setDrawerMode('edit');
  };

  const handleDeactivateConfirm = async () => {
    const form = deactivateDialog.form;
    setDeactivateDialog({ open: false, form: null });
    try {
      await deleteAgendaForm(form.id).unwrap();
      dispatch(showToast({ message: `Form "${form.name}" deactivated`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: `Failed to deactivate "${form.name}"`, severity: 'error' }));
    }
  };

  const columns = [
    { field: 'name', headerName: 'Form Name', flex: 1, minWidth: 180 },
    {
      field: 'code',
      headerName: 'Code',
      width: 200,
      renderCell: ({ value }) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{value}</Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) =>
        value ? (
          <Typography variant="caption" color="text.secondary">{value}</Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'fields',
      headerName: 'Fields',
      width: 90,
      sortable: false,
      renderCell: ({ value }) => (
        <Chip label={Array.isArray(value) ? value.length : 0} size="small" variant="outlined" />
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
          color={value ? 'success' : 'default'}
          variant={value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 96,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => handleEdit(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {row.is_active && (
            <IconButton
              size="small"
              color="warning"
              onClick={() => setDeactivateDialog({ open: true, form: row })}
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Agenda Form Configuration"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Agenda Forms' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setSelectedForm(null); setDrawerMode('create'); }}
          >
            Add Form
          </Button>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage reusable agenda form templates. Each form defines the dynamic fields shown when
        creating an agenda item. Assign forms to wings via Wing Configuration.
      </Typography>

      <DataGrid
        rows={forms}
        columns={columns}
        rowCount={forms.length}
        disableRowSelectionOnClick
        autoHeight
        hideFooter={forms.length <= 25}
        getRowHeight={() => 'auto'}
        sx={{ bgcolor: 'background.paper' }}
      />

      <FormDrawer
        open={Boolean(drawerMode)}
        mode={drawerMode}
        initialData={selectedForm}
        onClose={() => { setDrawerMode(null); setSelectedForm(null); }}
      />

      <ConfirmDialog
        open={deactivateDialog.open}
        onClose={() => setDeactivateDialog({ open: false, form: null })}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Form"
        message={`Deactivate "${deactivateDialog.form?.name}"? It will no longer appear in wing assignment dropdowns or agenda item creation. Existing agenda items using this form are not affected.`}
        variant="destructive"
        confirmLabel="Deactivate"
      />
    </Box>
  );
};
