const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieSession = require("cookie-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

const app = express();

// Session config
app.use(
  cookieSession({
    name: "session",
    keys: ["flipxsecret"],
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })
);

app.use(passport.initialize());
app.use(passport.session());

// CORS config for frontend on Render
app.use(
  cors({
    origin: "https://flipx-auth.onrender.com",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// User session handling
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
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // You could add database logic here
      return done(null, profile);
    }
  )
);

// Routes
app.get("/", (req, res) => {
  res.send("FlipXDeals Auth Server Running!");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "https://flipx-auth.onrender.com",
  })
);

app.get("/auth/logout", (req, res) => {
  req.logout();
  res.redirect("https://flipx-auth.onrender.com");
});

app.get("/auth/user", (req, res) => {
  res.send(req.user || null);
});

app.get("/auth/failure", (req, res) => {
  res.send("Login failed!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
});
