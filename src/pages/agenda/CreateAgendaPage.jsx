import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useGetAgendaItemQuery, useCreateAgendaItemMutation, useUpdateAgendaItemMutation } from '../../store/api/agendaApi.js';
import { useGetWingsQuery } from '../../store/api/wingsApi.js';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AutosaveIndicator } from '../../components/common/AutosaveIndicator.jsx';
import { useAgendaAutosave } from '../../hooks/useAgendaAutosave.js';
import { useUnsavedWarning } from '../../hooks/useUnsavedWarning.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { AttachmentUpload } from '../../components/agenda/AttachmentUpload.jsx';

const STEPS = ['Basic Information', 'Content & Recommendation', 'Attachments'];

export const CreateAgendaPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = usePermissions();

  const [activeStep, setActiveStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [savedItemId, setSavedItemId] = useState(id || null);

  const [form, setForm] = useState({
    topic: '',
    wing: '',
    meeting: '',
    agenda_form: '',
    file_number: '',
    description: '',
    discussion_points: '',
    is_supplementary: false,
  });
  const [errors, setErrors] = useState({});

  const { data: existingItem, isLoading: itemLoading } = useGetAgendaItemQuery(id, { skip: !id });
  const { data: wingsData } = useGetWingsQuery();
  const wings = Array.isArray(wingsData?.results) ? wingsData.results : Array.isArray(wingsData) ? wingsData : [];
  const { data: meetingsData } = useGetMeetingsQuery({ status: 'SCHEDULED', limit: 50 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const [createAgendaItem, { isLoading: creating }] = useCreateAgendaItemMutation();
  const [updateAgendaItem] = useUpdateAgendaItemMutation();

  // Pre-fill form when editing
  useEffect(() => {
    if (existingItem && isEdit) {
      setForm({
        topic: existingItem.topic || '',
        wing: existingItem.wing?.id || existingItem.wing || '',
        meeting: existingItem.meeting?.id || existingItem.meeting || '',
        agenda_form: existingItem.agenda_form?.id || existingItem.agenda_form || '',
        file_number: existingItem.file_number || '',
        description: existingItem.description || '',
        discussion_points: existingItem.discussion_points || '',
        is_supplementary: existingItem.is_supplementary || false,
      });
    }
  }, [existingItem, isEdit]);

  const handleField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
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
      if (!form.topic.trim()) errs.topic = 'Topic is required';
      if (!form.wing) errs.wing = 'Wing is required';
      if (!form.meeting) errs.meeting = 'Meeting is required';
    }
    if (step === 1) {
      if (!form.description.trim()) errs.description = 'Description is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) return;

    // Auto-create draft on step 1 completion
    if (activeStep === 0 && !savedItemId) {
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

      {/* Unsaved warning dialog */}
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
                fullWidth
                label="Topic"
                value={form.topic}
                onChange={handleField('topic')}
                error={!!errors.topic}
                helperText={errors.topic}
                required
                placeholder="Briefly describe the agenda item..."
              />
              <TextField
                select
                fullWidth
                label="Meeting"
                value={form.meeting}
                onChange={handleField('meeting')}
                error={!!errors.meeting}
                helperText={errors.meeting}
                required
              >
                <MenuItem value="">Select meeting...</MenuItem>
                {meetings.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Wing"
                value={form.wing}
                onChange={handleField('wing')}
                error={!!errors.wing}
                helperText={errors.wing}
                required
              >
                <MenuItem value="">Select wing...</MenuItem>
                {wings.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="File Number"
                value={form.file_number}
                onChange={handleField('file_number')}
                placeholder="e.g. KPS/2026/001"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.is_supplementary}
                    onChange={handleField('is_supplementary')}
                  />
                }
                label="This is a supplementary agenda item"
              />
            </Box>
          )}

          {/* Step 2: Content */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Description"
                value={form.description}
                onChange={handleField('description')}
                error={!!errors.description}
                helperText={errors.description || 'Provide detailed background information'}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Discussion Points (Optional)"
                value={form.discussion_points}
                onChange={handleField('discussion_points')}
                helperText="Key points for discussion"
              />
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
                <Button variant="contained" onClick={handleNext} disabled={creating}>
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
