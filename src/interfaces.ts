// TODO: abstract from all js SDKs
export interface User {
  id: string;
  email?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NotificationAPIClientInterface {
  showInApp: (options: InAppOptions) => void;
  openInAppPopup: () => void;
  closeInAppPopup: () => void;
  setInAppUnread: (count: number) => void;
  processNotifications: (notifications: InappNotification[]) => void;
  destroy: () => void;
  elements: {
    websocket?: WebSocket;
    unread?: HTMLDivElement;
    popup?: HTMLDivElement;
    popupInner?: HTMLDivElement;
    button?: HTMLButtonElement;
    root?: HTMLElement;
    empty?: HTMLDivElement;
    header?: HTMLDivElement;
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
  websocket?: string;
  mock?: boolean;
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
