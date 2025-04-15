const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

const app = express();

app.set("trust proxy", 1); // 🟢 Enables correct handling of secure cookies behind Render's proxy

// CORS config for frontend
app.use(
  cors({
    origin: "https://flipx-auth.onrender.com", // ✅ your frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Session config (use express-session)
app.set("trust proxy", 1); // 🛡️ Tell Express we're behind a proxy (Render)

app.set("trust proxy", 1); // 🟢 Enables correct handling of secure cookies behind Render's proxy

app.use(
  session({
    name: "flipx-session",
    secret: "flipxsecret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ This is crucial for cross-site cookies on Render
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none", // ✅ Needed for cross-site cookie
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Session handlers
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://flipx-auth-server.onrender.com/auth/google/callback", // ✅ backend URL
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Routes
app.get("/", (req, res) => {
  res.send("✅ FlipXDeals Auth Server Running!");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "https://flipx-auth.onrender.com", // ✅ frontend on success
  })
);

app.get("/auth/user", (req, res) => {
  console.log("🔐 Session check — req.user:", req.user);
  console.log("📦 Session data:", req.session);
  res.json(req.user || null);
});

app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "none",
        secure: true,
      });
      res.redirect("https://flipx-auth.onrender.com"); // ✅ redirect back to frontend
    });
  });
});

app.get("/auth/failure", (req, res) => {
  res.status(401).send("Login failed. Please try again.");
});

// ✅ Debug route to test session status
app.get("/debug-session", (req, res) => {
  res.json({
    loggedIn: !!req.user,
    user: req.user || null,
    session: req.session || null,
  });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
});
