export interface Account {
  id: string;
  username: string;
  avatar?: string;
}

export interface AccountSession {
  user: Account | null;
  isLoggedIn: boolean;
}
