const jwt = require("jsonwebtoken");
const User = require("../models/User.model.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const OTPAuth = require("otpauth");
const encode = require("hi-base32").encode;
const { isAuth } = require("../middleware/authentication.middleware.js");

const router = require("express").Router();

router.post("/signup", async (req, res, next) => {
  const { email, username, password1 } = req.body;

  try {
    const potentialUser = await User.findOne({ email });

    if (!potentialUser) {
      const salt = bcrypt.genSaltSync(13);
      const passwordHash = bcrypt.hashSync(password1, salt);

      try {
        const newUser = await User.create({ email, username, passwordHash });

        const userObj = {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          reviews: newUser.reviews,
          cart: newUser.cart,
          ownedGames: newUser.ownedGames,
          wishlistedGame: newUser.wishlistedGame,
          otp_enabled: newUser.otp_enabled,
          otp_verified: newUser.otp_verified,
        };

        res.status(201).json(userObj);
      } catch (error) {
        next(error);
      }
    } else {
      res.status(400).json({ error: "User already exists" });
    }
  } catch (error) {
    next(error);
  }
});

//post login - need to refactor for 2fa

router.post("/login", async (req, res, next) => {
  const { loginCredential, password } = req.body;
  let potentialUser;
  try {
    if (loginCredential.split("").includes("@")) {
      const email = loginCredential;
      potentialUser = await User.findOne({ email });
    } else {
      const username = loginCredential;
      potentialUser = await User.findOne({ username });
    }

    if (potentialUser) {
      const passwordCorrect = bcrypt.compareSync(
        password,
        potentialUser.passwordHash
      );
      //check if 2fa is enabled - and password matches - send back a 202 with a temporary jwt token that we can then decrypt on the validate route
      //using a different secret here so it cant be used to validate the user

      if (passwordCorrect && potentialUser.otp_enabled) {
        const loginToken = jwt.sign(
          { userId: potentialUser._id },
          process.env.TOKEN_SECRET_MFA,
          { algorithm: "HS256", expiresIn: 600 } //expires in as INT is seconds
        );
        res.status(202).json({ loginToken });
      } else if (passwordCorrect) {
        const authToken = jwt.sign(
          { userId: potentialUser._id },
          process.env.TOKEN_SECRET,
          { algorithm: "HS256", expiresIn: "24h" }
        );
        res.status(200).json({ token: authToken });
      } else {
        res.status(403).json({ message: "Invalid Credentials" });
      }
    } else {
      res.status(401).json({ error: "Invalid Credentials" });
    }
  } catch (error) {
    next(error);
  }
});

const generateRandomBase32 = () => {
  const buffer = crypto.randomBytes(15);
  const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
  return base32;
};

router.post("/otp/generate", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found when generating otp" });
    }

    //generating a 24 character base32 encoded string
    const base32_secret = generateRandomBase32();

    //creating TOTP class instance
    let totp = new OTPAuth.TOTP({
      issuer: "Vanguard",
      label: "Vanguard",
      algorithm: "SHA1",
      digits: 6,
      secret: base32_secret,
    });

    let otpauth_url = totp.toString();

    await User.findByIdAndUpdate(userId, {
      otp_auth_url: otpauth_url,
      otp_base32: base32_secret,
    });

    res.status(200).json({ base32: base32_secret, otpauth_url });
  } catch (error) {
    next(error);
  }
});

router.post("/otp/verify", isAuth, async (req, res, next) => {
  //same as before, check and make sure we are properly passing the token here
  const { twoFactorToken } = req.body;
  const { userId } = req.tokenPayload;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Token is invalid or user doesn't exist" });
    }
    //creating totp instance to verify provided totp
    //might need to check if base32_secret exists if it causes issues
    let totp = new OTPAuth.TOTP({
      issuer: "Vanguard",
      label: "Vanguard",
      algorithm: "SHA1",
      digits: 6,
      secret: user.otp_base32,
    });

    let delta = totp.validate({ token: twoFactorToken });

    if (delta === null) {
      return res
        .status(401)
        .json({ message: "Token is invalid or user doesn't exist" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { otp_enabled: true, otp_verified: true },
      { new: true }
    );
    res.status(200).json({
      otp_verified: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/otp/validate", async (req, res, next) => {
  const { twoFactorToken, loginToken } = req.body;
  try {
    //verify jwt token to forward userId - allows us to forward userId
    const { userId } = jwt.verify(loginToken, process.env.TOKEN_SECRET_MFA);

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Token is invalid or user doesn't exist" });
    }

    let totp = new OTPAuth.TOTP({
      issuer: "Vanguard",
      label: "Vanguard",
      algorithm: "SHA1",
      digits: 6,
      secret: user.otp_base32,
    });

    let delta = totp.validate({ token: twoFactorToken, window: 1 });

    if (delta === null) {
      return res
        .status(401)
        .json({ message: "Token is invalid or user doesn't exist" });
    }
    //if all checks pass, then we send back the token like we would in a regular signin
    const authToken = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    res.status(200).json({ token: authToken });
  } catch (error) {
    next(error);
  }
});

router.post("/otp/disable", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User doesn't exist" });
    }
    const updatedUser = await User.findByIdAndUpdate(userId, {
      otp_enabled: false,
    });

    res.status(200).json({
      otp_disabled: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify", isAuth, async (req, res) => {
  const currentUser = await User.findById(req.tokenPayload.userId);
  res.status(200).json(currentUser);
});

module.exports = router;
