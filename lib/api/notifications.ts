import { api } from "@/lib/axios";
import { NotificationsResponse } from "@/types";

export const fetchNotifications = async (
  unreadOnly = false,
): Promise<NotificationsResponse> => {
  const { data } = await api.get<NotificationsResponse>(
    `/api/notifications?limit=30${unreadOnly ? "&unread=true" : ""}`,
  );
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.post(`/api/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.post(`/api/notifications/read-all`);
  return data;
};
