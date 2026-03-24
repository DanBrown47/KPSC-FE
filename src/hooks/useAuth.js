import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectGlobalRole,
  selectMenuPermissions,
  logout,
} from '../store/authSlice.js';
import { authApi } from '../store/api/authApi.js';
import { agendaApi } from '../store/api/agendaApi.js';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const globalRole = useSelector(selectGlobalRole);
  const menuPermissions = useSelector(selectMenuPermissions);

  const hasPermission = (key) => {
    if (!menuPermissions) return false;
    return menuPermissions[key] === true;
  };

  const handleLogout = () => {
    dispatch(authApi.util.resetApiState());
    dispatch(agendaApi.util.resetApiState());
    dispatch(logout());
    navigate('/login');
  };

  return {
    isAuthenticated,
    currentUser,
    globalRole,
    menuPermissions,
    hasPermission,
    handleLogout,
  };
};
