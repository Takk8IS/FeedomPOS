interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IntegrationSettings {
  quickbooksEnabled: boolean;
  quickbooksTokens: OAuthTokens;
  xeroEnabled: boolean;
  xeroTokens: OAuthTokens;
}
