/** First-sign-in password setup is for local development only. */
export const passwordSetupEnabled = process.env.NODE_ENV !== "production" && !process.env.VERCEL;
