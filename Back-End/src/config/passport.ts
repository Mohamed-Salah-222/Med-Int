import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";
import { oauthStateStore } from "./oauthStateStore";

//* serializeUser/deserializeUser are intentionally absent: they are only ever
//* called when passport persists a login into a session, and this app runs the
//* OAuth routes with session: false and authenticates everything else by JWT.

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      //* CSRF protection for the authorization request. `store` takes priority
      //* over `state: true` in passport-oauth2, which would otherwise install a
      //* session-backed store and throw without express-session.
      store: oauthStateStore,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if email already exists (linked to regular account)
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.isVerified = true; // Google emails are verified
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          isVerified: true,
          role: "User", // Default role
          password: Math.random().toString(36), // Random password (won't be used)
        });

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

export default passport;
