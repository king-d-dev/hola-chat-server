export interface User {
  email: string;
}

export enum SocketEvent {
  GET_ALL_MESSAGES = 'GET_ALL_MESSAGES',
  GET_SELECTED_USER_MESSAGES = 'GET_SELECTED_USER_MESSAGES',
  ACTIVE_USERS = 'ACTIVE_USERS',
}
