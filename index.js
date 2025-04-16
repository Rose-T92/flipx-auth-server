const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

dotenv.config();
const app = express();

// 🛡️ Proxy support for secure cookies on Render
app.set("trust proxy", 1);

// 🌐 Allow frontend to send credentials
app.use(
  cors({
    origin: "https://flipx-auth.onrender.com",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// 🗝️ Session config
app.use(
  session({
    name: "connect.sid", // 🟢 Force default name so browser sends it back
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


// 🧠 Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Serialize full profile
passport.serializeUser((user, done) => {
  done(null, user); // 🟢 Save entire profile in session
});

passport.deserializeUser((user, done) => {
  done(null, user); // 🟢 Retrieve full profile
});

// 🔐 Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://flipx-auth-server.onrender.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("✅ Google Profile:", profile.displayName);
      return done(null, profile);
    }
  )
);

// 🚀 Routes
app.get("/", (req, res) => {
  res.send("✅ FlipXDeals Auth Server Running!");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: "https://flipx-auth.onrender.com",
    session: true,
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

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Auth server running on port ${PORT}`);
});
