import { usePermissions } from '../../hooks/usePermissions.js';
import { ChairmanPSDashboard } from './ChairmanPSDashboard.jsx';
import { ChairmanDashboard } from './ChairmanDashboard.jsx';
import { MemberDashboard } from './MemberDashboard.jsx';
import { RNADashboard } from './RNADashboard.jsx';
import { WingASJSDashboard } from './WingASJSDashboard.jsx';
import { WingMemberDashboard } from './WingMemberDashboard.jsx';
import { AdminDashboard } from './AdminDashboard.jsx';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const ROLE_DASHBOARDS = {
  CHAIRMAN_PS: ChairmanPSDashboard,
  CHAIRMAN: ChairmanDashboard,
  MEMBER: MemberDashboard,
  RNA_ASJS: RNADashboard,
  WING_ASJS: WingASJSDashboard,
  WING_AS: WingASJSDashboard,
  WING_JS: WingASJSDashboard,
  WING_HEAD: WingASJSDashboard,
  WING_MEMBER: WingMemberDashboard,
  WEB_ADMIN: AdminDashboard,
};

export const DashboardRouter = () => {
  const { globalRole } = usePermissions();
  const DashboardComponent = ROLE_DASHBOARDS[globalRole];

  if (!DashboardComponent) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h2" color="text.secondary">
          Welcome to KPSC Meeting Management System
        </Typography>
      </Box>
    );
  }

  return <DashboardComponent />;
};
