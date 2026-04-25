import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import { useGetAgendaItemQuery, useCreateAgendaItemMutation, useUpdateAgendaItemMutation, useLazyGetNextFileNumberQuery } from '../../store/api/agendaApi.js';
import { useGetWingsQuery, useGetWingAgendaFormsQuery } from '../../store/api/wingsApi.js';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AutosaveIndicator } from '../../components/common/AutosaveIndicator.jsx';
import { DynamicAgendaForm } from '../../components/agenda/DynamicAgendaForm.jsx';
import { useAgendaAutosave } from '../../hooks/useAgendaAutosave.js';
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { AttachmentUpload } from '../../components/agenda/AttachmentUpload.jsx';

const STEPS = ['Basic Information', 'Content & Recommendation', 'Attachments'];

const WING_SCOPED_ROLES = ['WING_MEMBER', 'WING_ASJS', 'WING_AS', 'WING_JS', 'WING_HEAD', 'CA'];

export const CreateAgendaPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { currentUser } = usePermissions();
  const preselectedMeeting = searchParams.get('meeting') || '';

  const [activeStep, setActiveStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [savedItemId, setSavedItemId] = useState(id || null);

  // File prefix selection state
  const [selectedPrefix, setSelectedPrefix] = useState('');
  const [fileNumPart, setFileNumPart] = useState('');

  const [form, setForm] = useState({
    topic: '',
    wing: '',
    meeting: preselectedMeeting,
    agenda_form: '',
    file_number: '',
    description: '',
    discussion_points: '',
    is_supplementary: false,
    form_data: {},
  });
  const [errors, setErrors] = useState({});

  const { data: existingItem, isLoading: itemLoading } = useGetAgendaItemQuery(id, { skip: !id });
  const { data: wingsData } = useGetWingsQuery();
  const wings = Array.isArray(wingsData?.results) ? wingsData.results : Array.isArray(wingsData) ? wingsData : [];

  const isWingScoped = WING_SCOPED_ROLES.includes(currentUser?.global_role);
  const activeWingId = currentUser?.active_wing_id;

  // If active_wing_id isn't set, fall back to the user's single active wing (if unambiguous)
  const userActiveWingIds = isWingScoped
    ? (currentUser?.wing_roles || []).filter(r => r.is_active !== false).map(r => r.wing)
    : [];
  const effectiveWingId = activeWingId || (userActiveWingIds.length === 1 ? userActiveWingIds[0] : null);

  // Available wings for display (still needed for the locked label)
  const userActiveWingRoles = isWingScoped
    ? (currentUser?.wing_roles || []).filter(r => r.is_active !== false)
    : [];
  const userWingIds = userActiveWingRoles.map(r => r.wing);
  const availableWings = isWingScoped && userWingIds.length > 0
    ? wings.filter(w => userWingIds.includes(w.id))
    : wings;

  // Derive file prefixes from selected wing
  const selectedWingData = wings.find(w => w.id === form.wing || w.id === String(form.wing));
  const filePrefixes = selectedWingData?.file_prefix
    ? selectedWingData.file_prefix.split(',').map(p => p.trim()).filter(Boolean)
    : [];
  const hasMultiplePrefixes = filePrefixes.length > 1;
  const hasSinglePrefix = filePrefixes.length === 1;

  // Fetch agenda forms filtered by selected wing
  const { data: wingFormsData } = useGetWingAgendaFormsQuery(form.wing, { skip: !form.wing });
  const wingForms = Array.isArray(wingFormsData?.results)
    ? wingFormsData.results
    : Array.isArray(wingFormsData) ? wingFormsData : [];

  // Derive field definitions for selected agenda form
  const selectedWingForm = wingForms.find(
    wf => String(wf.agenda_form) === String(form.agenda_form)
  );
  const selectedFormFields = selectedWingForm?.agenda_form_fields || [];

  // Fetch all meetings (including FINALIZED) so users can create supplementary items
  const { data: meetingsData } = useGetMeetingsQuery({ limit: 100 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const [createAgendaItem, { isLoading: creating }] = useCreateAgendaItemMutation();
  const [updateAgendaItem] = useUpdateAgendaItemMutation();
  const [fetchNextFileNumber] = useLazyGetNextFileNumberQuery();

  // Pre-fill form when editing
  useEffect(() => {
    if (existingItem && isEdit) {
      const rawFileNumber = existingItem.file_number || '';
      setForm({
        topic: existingItem.topic || '',
        wing: existingItem.wing?.id || existingItem.wing || '',
        meeting: existingItem.meeting?.id || existingItem.meeting || '',
        agenda_form: existingItem.agenda_form?.id || existingItem.agenda_form || '',
        file_number: rawFileNumber,
        description: existingItem.description || '',
        discussion_points: existingItem.discussion_points || '',
        is_supplementary: existingItem.is_supplementary || false,
        form_data: existingItem.form_data || {},
      });
      setFileNumPart(rawFileNumber);
    }
  }, [existingItem, isEdit]);

  // Lock wing to effective wing for wing-scoped users
  useEffect(() => {
    if (!isEdit && isWingScoped && effectiveWingId && !form.wing) {
      setForm(p => ({ ...p, wing: effectiveWingId, agenda_form: '' }));
    }
  }, [isWingScoped, effectiveWingId, isEdit]);

  // Auto-set single prefix when wing changes
  useEffect(() => {
    if (hasSinglePrefix && selectedPrefix !== filePrefixes[0]) {
      setSelectedPrefix(filePrefixes[0]);
    } else if (!hasSinglePrefix && !hasMultiplePrefixes) {
      setSelectedPrefix('');
    }
  }, [form.wing, filePrefixes.join(',')]);

  // Auto-fill file number part when prefix and wing are set (only when empty)
  useEffect(() => {
    if (!isEdit && form.wing && selectedPrefix && !fileNumPart) {
      fetchNextFileNumber({ wingId: form.wing, prefix: selectedPrefix })
        .unwrap()
        .then(data => { if (data?.file_num_part) setFileNumPart(data.file_num_part); })
        .catch(() => {});
    }
  }, [selectedPrefix, form.wing]);

  // Sync derived file_number into form whenever prefix/number parts change
  useEffect(() => {
    const derived = selectedPrefix && fileNumPart
      ? `${selectedPrefix}/${fileNumPart}`
      : fileNumPart;
    setForm(p => ({ ...p, file_number: derived }));
  }, [selectedPrefix, fileNumPart]);

  // Apply auto-supplementary logic for preselected meeting once meetings list loads
  useEffect(() => {
    if (!isEdit && preselectedMeeting && meetings.length > 0) {
      const mtg = meetings.find((m) => String(m.id) === String(preselectedMeeting));
      if (mtg) {
        setForm((p) => ({
          ...p,
          is_supplementary: mtg.status === 'FINALIZED' ? true : mtg.status === 'SCHEDULED' ? false : p.is_supplementary,
        }));
      }
    }
  }, [meetings, preselectedMeeting, isEdit]);

  const handleField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleWingChange = (e) => {
    const wingId = e.target.value;
    setForm((p) => ({ ...p, wing: wingId, agenda_form: '', form_data: {} }));
    setSelectedPrefix('');
    setFileNumPart('');
    setIsDirty(true);
    if (errors.wing) setErrors((p) => ({ ...p, wing: '' }));
  };

  const handleFormDataChange = (key, value) => {
    setForm(p => ({ ...p, form_data: { ...p.form_data, [key]: value } }));
    setIsDirty(true);
  };

  // Derive selected meeting object to check its status
  const selectedMeeting = meetings.find((m) => String(m.id) === String(form.meeting));
  const selectedMeetingStatus = selectedMeeting?.status;

  const handleMeetingChange = (e) => {
    const meetingId = e.target.value;
    const mtg = meetings.find((m) => String(m.id) === String(meetingId));
    setForm((p) => ({
      ...p,
      meeting: meetingId,
      is_supplementary: mtg?.status === 'FINALIZED' ? true
        : mtg?.status === 'SCHEDULED' ? false
        : p.is_supplementary,
    }));
    setIsDirty(true);
    if (errors.meeting) setErrors((p) => ({ ...p, meeting: '' }));
  };

  const getFormData = () => form;

  const { saveStatus, lastSaved } = useAgendaAutosave({
    agendaItemId: savedItemId,
    getFormData,
    isDirty,
  });

  const { isBlocked, confirmNavigation, cancelNavigation } = useUnsavedWarning(isDirty);

  const validateStep = (step) => {
    const errs = {};
    if (step === 0) {
      if (!form.wing) errs.wing = 'Wing is required';
      if (!form.meeting) errs.meeting = 'Meeting is required';
      if (!form.agenda_form) errs.agenda_form = 'Agenda form is required';
    }
    if (step === 1) {
      const subjectField = selectedFormFields.find(f => f.key === 'subject');
      if (subjectField?.required && !form.form_data?.subject?.trim()) {
        errs.form_data_subject = 'Subject is required';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) return;

    if (activeStep === 1 && !savedItemId) {
      try {
        const result = await createAgendaItem(form).unwrap();
        setSavedItemId(result.id);
        setIsDirty(false);
        dispatch(showToast({ message: 'Draft saved', severity: 'info' }));
      } catch {
        dispatch(showToast({ message: 'Failed to save draft', severity: 'error' }));
        return;
      }
    } else if (savedItemId && isDirty) {
      try {
        await updateAgendaItem({ id: savedItemId, ...form }).unwrap();
        setIsDirty(false);
      } catch {
        // Continue anyway
      }
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleFinish = async () => {
    try {
      if (savedItemId && isDirty) {
        await updateAgendaItem({ id: savedItemId, ...form }).unwrap();
      }
      setIsDirty(false);
      dispatch(showToast({ message: isEdit ? 'Item updated successfully' : 'Agenda item created', severity: 'success' }));
      navigate(savedItemId ? `/agenda/${savedItemId}` : '/agenda');
    } catch {
      dispatch(showToast({ message: 'Failed to save', severity: 'error' }));
    }
  };

  if (isEdit && itemLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Agenda Item' : 'Create Agenda Item'}
        breadcrumbs={[
          { label: 'Agenda Items', href: '/agenda' },
          { label: isEdit ? 'Edit' : 'New Item' },
        ]}
      />

      {isBlocked && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card sx={{ maxWidth: 400, p: 2 }}>
            <CardContent>
              <Typography variant="h3" gutterBottom>Unsaved Changes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You have unsaved changes. Are you sure you want to leave?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={cancelNavigation} fullWidth>Stay</Button>
                <Button variant="contained" color="error" onClick={confirmNavigation} fullWidth>Leave</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Basic Info */}
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                select
                fullWidth
                label="Meeting"
                value={form.meeting}
                onChange={handleMeetingChange}
                error={!!errors.meeting}
                helperText={errors.meeting}
                required
              >
                <MenuItem value="">Select meeting...</MenuItem>
                {meetings.map((m) => (
                  <MenuItem key={m.id} value={m.id} disabled={m.status === 'COMPLETED'}>
                    {m.title}
                    {m.status !== 'SCHEDULED' && (
                      <Typography component="span" variant="caption" sx={{ ml: 1, color: m.status === 'FINALIZED' ? 'warning.main' : 'text.disabled' }}>
                        [{m.status}]
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </TextField>

              {selectedMeetingStatus === 'FINALIZED' && (
                <Alert severity="info">
                  This meeting is finalized. New agenda items will be created as <strong>supplementary</strong>.
                </Alert>
              )}
              {selectedMeetingStatus === 'COMPLETED' && (
                <Alert severity="error">
                  This meeting is completed. No new agenda items can be added.
                </Alert>
              )}

              {/* Wing — locked to active wing for wing-scoped users */}
              <TextField
                select
                fullWidth
                label="Wing"
                value={form.wing}
                onChange={handleWingChange}
                error={!!errors.wing}
                helperText={isWingScoped && effectiveWingId ? 'Locked to your active wing' : errors.wing}
                required
                disabled={!form.meeting || (isWingScoped && !!effectiveWingId)}
              >
                <MenuItem value="">Select wing...</MenuItem>
                {availableWings.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Agenda Form"
                value={form.agenda_form}
                onChange={handleField('agenda_form')}
                error={!!errors.agenda_form}
                helperText={errors.agenda_form || (form.wing ? '' : 'Select a wing first')}
                required
                disabled={!form.meeting || !form.wing}
              >
                <MenuItem value="">Select agenda form...</MenuItem>
                {wingForms.map((wf) => (
                  <MenuItem key={wf.agenda_form} value={wf.agenda_form}>
                    {wf.agenda_form_name || wf.agenda_form_code}
                  </MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_supplementary}
                    onChange={handleField('is_supplementary')}
                    disabled={!form.meeting || selectedMeetingStatus === 'FINALIZED'}
                  />
                }
                label={
                  selectedMeetingStatus === 'FINALIZED'
                    ? 'Supplementary agenda item (required for finalized meetings)'
                    : 'This is a supplementary agenda item'
                }
              />
            </Box>
          )}

          {/* Step 2: Content — dynamic per agenda form */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* File Number — with prefix support */}
              {hasMultiplePrefixes ? (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    select
                    label="File Prefix"
                    value={selectedPrefix}
                    onChange={(e) => { setSelectedPrefix(e.target.value); setIsDirty(true); }}
                    sx={{ minWidth: 140 }}
                    required
                    disabled={!form.wing}
                  >
                    <MenuItem value="">Select prefix...</MenuItem>
                    {filePrefixes.map(p => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label="File Number"
                    value={fileNumPart}
                    onChange={(e) => { setFileNumPart(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. 2026/001"
                    InputProps={selectedPrefix ? {
                      startAdornment: <InputAdornment position="start">{selectedPrefix}/</InputAdornment>,
                    } : undefined}
                    disabled={!form.wing}
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="File Number"
                  value={fileNumPart}
                  onChange={(e) => { setFileNumPart(e.target.value); setIsDirty(true); }}
                  placeholder={hasSinglePrefix ? `e.g. ${filePrefixes[0]}/2026/001` : 'e.g. KPS/2026/001'}
                  InputProps={hasSinglePrefix ? {
                    startAdornment: <InputAdornment position="start">{filePrefixes[0]}/</InputAdornment>,
                  } : undefined}
                  disabled={!form.meeting}
                />
              )}

              {selectedFormFields.length === 0 ? (
                <Alert severity="warning">
                  No fields configured for this agenda form. Please contact your administrator.
                </Alert>
              ) : (
                <>
                  {errors.form_data_subject && (
                    <Alert severity="error">{errors.form_data_subject}</Alert>
                  )}
                  <DynamicAgendaForm
                    fields={selectedFormFields}
                    formData={form.form_data}
                    onChange={handleFormDataChange}
                  />
                </>
              )}
            </Box>
          )}

          {/* Step 3: Attachments */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload supporting documents. Each file requires a friendly name before uploading.
              </Typography>
              {savedItemId ? (
                <AttachmentUpload agendaItemId={savedItemId} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Save the item first to upload attachments.
                </Typography>
              )}
            </Box>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={handleBack} disabled={activeStep === 0} variant="outlined">
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={creating || (activeStep === 0 && selectedMeetingStatus === 'COMPLETED')}
                >
                  {creating ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button variant="contained" color="success" onClick={handleFinish}>
                  {isEdit ? 'Save Changes' : 'Finish'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <AutosaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
    </Box>
  );
};
