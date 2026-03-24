import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '../store/api/notificationsApi.js';

export const useNotifications = () => {
  const {
    data,
    isLoading,
    refetch,
  } = useGetNotificationsQuery(
    { limit: 20 },
    {
      pollingInterval: 60000,
      refetchOnFocus: true,
    }
  );

  const [markRead] = useMarkNotificationReadMutation();

  const notifications = data?.results || data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    try {
      await markRead(id).unwrap();
    } catch {
      // silently fail
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markRead: handleMarkRead,
  };
};
