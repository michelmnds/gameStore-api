const jwt = require("jsonwebtoken");
const User = require("../models/User.model.js");
const bcrypt = require("bcrypt");
const { isAuth } = require("../middleware/authentication.middleware.js");

const router = require("express").Router();

router.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const potentialUser = await User.findOne({ email });

    if (!potentialUser) {
      const salt = bcrypt.genSaltSync(13);
      const passwordHash = bcrypt.hashSync(password, salt);

      try {
        const newUser = await User.create({ email, username, passwordHash });

        res.status(201).json(newUser);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.status(400).json({ error: "User already exists" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/login", async (req, res) => {
  const { loginCredential, password } = req.body;

  if (loginCredential.split("").includes("@")) {
    const email = loginCredential;

    try {
      const potentialUser = await User.findOne({ email });

      if (potentialUser) {
        const passwordCorrect = bcrypt.compareSync(
          password,
          potentialUser.passwordHash
        );
        if (passwordCorrect) {
          const authToken = jwt.sign(
            { userId: potentialUser._id },
            process.env.TOKEN_SECRET,
            { algorithm: "HS256", expiresIn: "12h" }
          );
          res.status(200).json({ token: authToken });
        } else {
          res.status(403).json({ message: "Invalid email or password" });
        }
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    const username = loginCredential;

    try {
      const potentialUser = await User.findOne({ username });

      if (potentialUser) {
        const passwordCorrect = bcrypt.compareSync(
          password,
          potentialUser.passwordHash
        );
        if (passwordCorrect) {
          const authToken = jwt.sign(
            { userId: potentialUser._id },
            process.env.TOKEN_SECRET,
            { algorithm: "HS256", expiresIn: "12h" }
          );
          res.status(200).json({ token: authToken });
        } else {
          res.status(403).json({ message: "Invalid username or password" });
        }
      } else {
        res.status(401).json({ error: "Invalid username or password" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

router.get("/verify", isAuth, async (req, res) => {
  const currentUser = await User.findById(req.tokenPayload.userId);
  res.status(200).json(currentUser);
});

module.exports = router;
