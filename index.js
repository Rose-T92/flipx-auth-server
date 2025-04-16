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
app.set("trust proxy", 1); // ✅ tell Express we're behind Render's proxy

app.use(
  session({
    name: "flipx-session",
    secret: "flipxsecret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ required for secure cookies with proxies (Render)
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// 🧠 Passport
app.use(passport.initialize());
app.use(passport.session());

// 🛠️ Correct session setup
passport.serializeUser((user, done) => {
  console.log("✅ Serializing user:", user.displayName);
  done(null, user); // Store entire profile
});

passport.deserializeUser((user, done) => {
  console.log("✅ Deserializing user:", user.displayName);
  done(null, user); // Retrieve entire profile
});

// ✅ Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://flipx-auth-server.onrender.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("✅ Google Profile:", profile.displayName);
      return done(null, profile); // Pass the whole profile to serializeUser
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
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    // 🔒 Manually save session before redirect
    req.login(req.user, (err) => {
      if (err) {
        console.error("❌ Login error:", err);
        return res.redirect("/auth/failure");
      }
      return res.redirect("https://flipx-auth.onrender.com");
    });
  }
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
