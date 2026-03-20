import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as LineStrategy } from "passport-line-auth";
import { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";

type AuthDone = (error: unknown, user?: User | false) => void;

type GoogleProfile = {
  id: string;
  displayName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
};

type KakaoProfile = {
  id: string | number;
  displayName?: string;
  _json?: {
    kakao_account?: { email?: string };
    properties?: { profile_image?: string };
  };
};

type LineProfile = {
  id: string;
  displayName?: string;
  pictureUrl?: string;
};

export function setupAuth(app: Express) {
  const SessionStore = MemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPLIT_ID || "skin-diary-secret",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
        callbackURL: "/auth/google/callback",
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: AuthDone
      ) => {
        try {
          let user = await storage.getUserByGoogleId(profile.id);
          if (!user) {
            user = await storage.createUser({
              username: profile.displayName || profile.emails?.[0].value || `google_${profile.id}`,
              googleId: profile.id,
              email: profile.emails?.[0].value,
              avatar: profile.photos?.[0].value,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Kakao Strategy
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID || "YOUR_KAKAO_CLIENT_ID",
        clientSecret: process.env.KAKAO_CLIENT_SECRET || "YOUR_KAKAO_CLIENT_SECRET", // 카카오는 secret이 선택사항입니다.
        callbackURL: "/auth/kakao/callback",
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: KakaoProfile,
        done: AuthDone
      ) => {
        try {
          let user = await storage.getUserByKakaoId(profile.id.toString());
          if (!user) {
            user = await storage.createUser({
              username: profile.displayName || `kakao_${profile.id}`,
              kakaoId: profile.id.toString(),
              email: profile._json?.kakao_account?.email,
              avatar: profile._json?.properties?.profile_image,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // LINE Strategy
  passport.use(
    new LineStrategy(
      {
        channelID: process.env.LINE_CHANNEL_ID || "2009518965",
        channelSecret: process.env.LINE_CHANNEL_SECRET || "",
        callbackURL: "/auth/line/callback",
        scope: ["profile", "openid"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: LineProfile,
        done: AuthDone
      ) => {
        try {
          let user = await storage.getUserByLineId(profile.id);
          if (!user) {
            user = await storage.createUser({
              username: profile.displayName || `line_${profile.id}`,
              lineId: profile.id,
              avatar: profile.pictureUrl,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Auth Routes
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => res.redirect("/")
  );

  app.get("/auth/kakao", passport.authenticate("kakao"));
  app.get(
    "/auth/kakao/callback",
    passport.authenticate("kakao", { failureRedirect: "/login" }),
    (req, res) => res.redirect("/")
  );

  app.get("/auth/line", passport.authenticate("line"));
  app.get(
    "/auth/line/callback",
    passport.authenticate("line", { failureRedirect: "/login" }),
    (req, res) => res.redirect("/")
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).send("Not authenticated");
    }
  });
}
