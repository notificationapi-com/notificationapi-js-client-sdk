// TODO: abstract from all js SDKs
export interface User {
  id: string;
  email?: string;
}

export interface Options {
  root: string;
  clientId: string;
  userId: string;
  inline?: boolean;
  popupPosition?: string;
  websocket?: string;
  mock?: boolean;
}

export interface InappNotification {
  id: string;
  seen: boolean;
  title: string;
  redirectURL?: string;
  imageURL?: string;
  date: string; // ISO date
}

export interface WS_NotificationsRequest {
  route: 'inapp_web/notifications';
  payload: {
    before?: string; // ISO date
    count: number;
  };
}

export interface WS_NotificationsResponse {
  route: 'inapp_web/notifications';
  payload: {
    notifications: InappNotification[];
  };
}

export interface WS_UnreadCountResponse {
  route: 'inapp_web/unread_count';
  payload: {
    count: number;
  };
}

export interface WS_UnreadCountRequest {
  route: 'inapp_web/unread_count';
}

export interface WS_ClearUnreadRequest {
  route: 'inapp_web/unread_clear';
}
