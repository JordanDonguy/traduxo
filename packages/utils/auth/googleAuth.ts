export const getGoogleAuthUrl = (redirectUri?: string) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const redirect = encodeURIComponent(
    redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
  );
  const scope = encodeURIComponent("openid email profile");

  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirect}&scope=${scope}&access_type=offline&prompt=consent`;
};
