export interface User {
  id: string;
  email?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NotificationAPIClientInterface {
  showInApp: (options: InAppOptions) => void;
  showUserPreferences: () => void;
  openInAppPopup: () => void;
  closeInAppPopup: () => void;
  setInAppUnread: (count: number) => void;
  processNotifications: (notifications: InappNotification[]) => void;
  renderPreferences: (preferences: Preference[]) => void;
  destroy: () => void;
  websocket?: WebSocket;
  elements: {
    unread?: HTMLDivElement;
    popup?: HTMLDivElement;
    popupInner?: HTMLDivElement;
    button?: HTMLButtonElement;
    root?: HTMLElement;
    empty?: HTMLDivElement;
    header?: HTMLDivElement;
    preferencesContainer?: HTMLDivElement;
    preferencesPopup?: HTMLDivElement;
    preferencesLoading?: HTMLDivElement;
    preferencesEmpty?: HTMLDivElement;
    preferencesGrid?: HTMLDivElement;
  };
  state: {
    lastNotificationsRequestAt: number;
    notifications: InappNotification[];
    unread: number;
    oldestNotificationsDate: string;
    lastResponseNotificationsCount?: number;
    inappOptions?: InAppOptions;
    initOptions: InitOptions;
  };
}

export interface InitOptions {
  clientId: string;
  userId: string;
  userIdHash?: string;
  websocket?: string | false;
}

export interface InAppOptions {
  root: string;
  inline?: boolean;
  popupPosition?: PopupPosition;
}

export enum PopupPosition {
  TopLeft = 'topLeft',
  TopRight = 'topRight',
  LeftTop = 'leftTop',
  LeftBottom = 'leftBottom',
  BottomLeft = 'bottomLeft',
  BottomRight = 'bottomRight',
  RightTop = 'rightTop',
  RightBottom = 'rightBottom'
}

export interface InappNotification {
  id: string;
  seen: boolean;
  title: string;
  redirectURL?: string;
  imageURL?: string;
  date: string; // ISO date
}

export interface Preference {
  notificationId: string;
  title: string;
  settings: {
    channel: string;
    channelName: string;
    state: boolean;
  }[];
  subNotificationPreferences?: (Omit<
    Preference,
    'subNotificationPreferences'
  > & { subNotificationId: string })[];
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

export interface WS_NewNotificationsResponse {
  route: 'inapp_web/new_notifications';
  payload: {
    notifications: InappNotification[];
  };
}

export interface WS_UserPreferencesRequest {
  route: 'user_preferences/get_preferences';
}

export interface WS_UserPreferencesResponse {
  route: 'user_preferences/preferences';
  payload: {
    userPreferences: Preference[];
  };
}

export interface WS_UserPreferencesPatchRequest {
  route: 'user_preferences/patch_preferences';
  payload: {
    notificationId: string;
    subNotificationId?: string;
    channelPreferences: { channel: string; state: boolean }[];
  }[];
}

export type WS_ANY_VALID_REQUEST =
  | WS_NotificationsRequest
  | WS_ClearUnreadRequest
  | WS_UnreadCountRequest
  | WS_UserPreferencesRequest
  | WS_UserPreferencesRequest
  | WS_UserPreferencesPatchRequest;
