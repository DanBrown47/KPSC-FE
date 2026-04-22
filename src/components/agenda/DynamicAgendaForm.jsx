import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export const DynamicAgendaForm = ({ fields = [], formData = {}, onChange, readOnly = false }) => {
  if (!fields.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No fields defined for this form.
      </Typography>
    );
  }

  const handleChange = (key) => (e) => {
    onChange(key, e.target.value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {fields.map((field) => {
        const value = formData[field.key] ?? '';
        const commonProps = {
          key: field.key,
          fullWidth: true,
          label: field.label,
          value: readOnly ? (value || '—') : value,
          onChange: handleChange(field.key),
          required: field.required && !readOnly,
          disabled: readOnly,
          helperText: field.bilingual && !readOnly ? 'English / Malayalam' : undefined,
          InputLabelProps: field.type === 'date' ? { shrink: true } : undefined,
        };

        if (field.type === 'textarea') {
          return <TextField {...commonProps} multiline rows={4} />;
        }
        if (field.type === 'date') {
          return <TextField {...commonProps} type="date" />;
        }
        if (field.type === 'number') {
          return (
            <TextField
              {...commonProps}
              type="number"
              inputProps={{ min: 0 }}
              sx={{ maxWidth: 280 }}
            />
          );
        }
        return <TextField {...commonProps} />;
      })}
    </Box>
  );
};
