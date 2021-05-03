// TODO: abstract from all js SDKs
export interface User {
  id: string;
  email?: string;
}

export interface Options {
  root: string;
  inline?: boolean;
  popupPosition?: string;
  websocket?: string;
  notifications?: InappNotification[];
}

export interface InappNotification {
  title: string;
  redirectURL?: string;
  imageURL?: string;
  date: Date;
}

export interface WS_NotificationsRequest {
  type: 'inapp_web/notifications';
  payload: {
    before?: string; // ISO date
    count: number;
    envId: string;
    userId: string;
  };
}

export interface WS_NotificationsResponse {
  type: 'inapp_web/notifications';
  payload: {
    notifications: InappNotification[];
  };
}

export interface WS_UnreadCountResponse {
  type: 'inapp_web/unread_count';
  payload: {
    count: number;
  };
}

export interface WS_UnreadCountRequest {
  type: 'inapp_web/unread_count';
  payload: {
    envId: string;
    userId: string;
  };
}
