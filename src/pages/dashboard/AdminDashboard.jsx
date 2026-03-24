import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const AdminActionCard = ({ icon: Icon, title, description, path, color = 'primary.main' }) => {
  const navigate = useNavigate();
  return (
    <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }} onClick={() => navigate(path)}>
      <CardContent sx={{ py: 3 }}>
        <Icon sx={{ fontSize: 40, color, mb: 1 }} />
        <Typography variant="h4" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Administrator'}`}
        subtitle="System Administrator"
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AdminActionCard
            icon={PeopleIcon}
            title="User Management"
            description="Create, edit, and manage user accounts and role assignments."
            path="/admin/users"
            color="#1A4480"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AdminActionCard
            icon={AccountTreeIcon}
            title="Wing Configuration"
            description="Configure wing priorities and approval chains."
            path="/admin/wings"
            color="#7C3AED"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AdminActionCard
            icon={ManageSearchIcon}
            title="Audit Log"
            description="Review all system activity and user actions."
            path="/admin/audit"
            color="#059669"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
