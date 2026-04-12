import { useSelector } from 'react-redux';
import { selectGlobalRole, selectCurrentUser } from '../store/authSlice.js';

const ROLE_HIERARCHY = {
  WEB_ADMIN: 7,
  CHAIRMAN_PS: 6,
  CHAIRMAN: 5,
  MEMBER: 4,
  RNA_ASJS: 3,
  WING_ASJS: 2,
  WING_AS: 2,
  WING_JS: 2,
  WING_HEAD: 2,
  WING_MEMBER: 1,
  SECRETARY_PA: 3,
  CA: 1,
  RA_WING: 1,
};

export const usePermissions = () => {
  const globalRole = useSelector(selectGlobalRole);
  const currentUser = useSelector(selectCurrentUser);

  const isRole = (role) => globalRole === role;

  const isAtLeastRole = (minRole) => {
    const userLevel = ROLE_HIERARCHY[globalRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= minLevel;
  };

  const canManageUsers = () => isRole('WEB_ADMIN');
  const canConfigureSystem = () => isRole('WEB_ADMIN') || isRole('CHAIRMAN_PS');
  const canConvokeMeetings = () => isRole('CHAIRMAN_PS');
  const canConsolidate = () => isRole('RNA_ASJS');
  const canVote = () => isRole('MEMBER') || isRole('CHAIRMAN') || isRole('CHAIRMAN_PS');

  const isWingMemberForWing = (wingId) => {
    const wingRoles = currentUser?.wing_roles || [];
    return wingRoles.some(
      (r) => r.wing === wingId && ['WING_MEMBER', 'CA'].includes(r.wing_role) && r.is_active !== false
    );
  };

  const isWingASJSForWing = (wingId) => {
    const wingRoles = currentUser?.wing_roles || [];
    return wingRoles.some((r) => r.wing_role === 'AS_JS' && r.wing === wingId && r.is_active !== false);
  };

  return {
    globalRole,
    currentUser,
    isRole,
    isAtLeastRole,
    canManageUsers,
    canConfigureSystem,
    canConvokeMeetings,
    canConsolidate,
    canVote,
    isWingMemberForWing,
    isWingASJSForWing,
    isWingMember: isRole('WING_MEMBER'),
    isWingASJS: isRole('WING_ASJS') || isRole('WING_AS') || isRole('WING_JS') || isRole('WING_HEAD'),
    isRNAASJS: isRole('RNA_ASJS'),
    isChairmanPS: isRole('CHAIRMAN_PS'),
    isChairman: isRole('CHAIRMAN'),
    isMember: isRole('MEMBER'),
    isWebAdmin: isRole('WEB_ADMIN'),
  };
};
