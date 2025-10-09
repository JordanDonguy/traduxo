export type TokenResult = {
  token: string;
  refreshToken?: string | null;
  language?: string;
  providers?: string[];
};
