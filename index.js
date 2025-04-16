const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();

const app = express();
app.set("trust proxy", 1); // 🟢 Render-specific for secure cookies

// CORS config for frontend
app.use(
  cors({
    origin: "https://flipx-auth.onrender.com", // ✅ Your frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Session config
app.use(
  session({
    name: "flipx-session",
    secret: "flipxsecret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://flipx-auth-server.onrender.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile); // <== This is correct
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user); // ✅ Store full profile
});

passport.deserializeUser((obj, done) => {
  done(null, obj); // ✅ Retrieve full profile
});

// Routes
app.get("/", (req, res) => {
  res.send("✅ FlipXDeals Auth Server Running!");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "https://flipx-auth.onrender.com", // ✅ this is fine
    session: true, // ✅ Make sure this is included (just in case)
  })
);

app.get("/auth/user", (req, res) => {
  console.log("🔐 Session check — req.user:", req.user);
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
      res.redirect("https://flipx-auth.onrender.com");
    });
  });
});

app.get("/auth/failure", (req, res) => {
  res.status(401).send("Login failed. Please try again.");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
});
