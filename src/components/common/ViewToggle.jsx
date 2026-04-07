import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

/**
 * Card / List view toggle button.
 * Controlled: pass viewMode + onChange from useViewPreference hook.
 */
export const ViewToggle = ({ viewMode, onChange }) => (
  <ToggleButtonGroup
    value={viewMode}
    exclusive
    onChange={(_, val) => { if (val) onChange(val); }}
    size="small"
    aria-label="View mode"
  >
    <ToggleButton value="card" aria-label="Card view">
      <Tooltip title="Card view">
        <ViewModuleIcon fontSize="small" />
      </Tooltip>
    </ToggleButton>
    <ToggleButton value="list" aria-label="List view">
      <Tooltip title="List view">
        <ViewListIcon fontSize="small" />
      </Tooltip>
    </ToggleButton>
  </ToggleButtonGroup>
);
