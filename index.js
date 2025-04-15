const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

const app = express();

// CORS config for frontend on Render
app.use(
  cors({
    origin: "https://flipx-auth.onrender.com",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Use express-session for session handling
app.use(
  session({
    secret: "flipxsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Set false locally if not using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

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
      callbackURL: "https://flipx-auth-server.onrender.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
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
  req.logout(() => {
    res.redirect("https://flipx-auth.onrender.com");
  });
});

app.get("/auth/user", (req, res) => {
  res.send(req.user || null);
});

app.get("/auth/failure", (req, res) => {
  res.send("Login failed!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
});
