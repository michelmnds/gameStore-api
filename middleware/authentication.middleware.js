const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const isAuth = (req, res, next) => {
  try {
    if (req.headers.authorization?.split(" ")[0] === "Bearer") {
      const token = req.headers.authorization.split(" ")[1];
      const payload = jwt.verify(token, process.env.TOKEN_SECRET);
      req.tokenPayload = payload;
      next();
    } else {
      throw new Error("No token");
    }
  } catch (error) {
    res.status(401).json("Token is not provided or not valid");
  }
};

const isDev = async (req, req, next) => {
  const userToCheck = await User.findById(req.tokenPayload.userId);
  if (userToCheck.roles?.includes("GAMEDEVELOPER")) {
    next();
  } else {
    res
      .status(403)
      .json("You don't have the required role to perform this action");
  }
};

const isAdmin = async (req, req, next) => {
  const userToCheck = await User.findById(req.tokenPayload.userId);
  if (userToCheck.roles?.includes("ADMIN")) {
    next();
  } else {
    res
      .status(403)
      .json("You don't have the required role to perform this action");
  }
};

module.exports = { isAuth, isDev, isAdmin };
