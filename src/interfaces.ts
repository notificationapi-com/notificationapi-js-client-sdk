// TODO: abstract from all js SDKs
export interface User {
  id: string;
  email?: string;
}

export interface InappNotification {
  title: string;
  redirectURL?: string;
  imageURL?: string;
  date: Date;
}
