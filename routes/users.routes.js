const User = require("../models/User.model.js");
const {
  isAuth,
  isAdmin,
} = require("../middleware/authentication.middleware.js");
const Game = require("../models/Game.model.js");
const router = require("express").Router();

//get user by ID

router.get("/:userId", isAuth, async (req, res, next) => {
  const { userId } = req.params;
  //COULD populate user.games and user.ownergames if we want
  try {
    const user = await User.findById(userId).populate(
      "ownedGames reviews wishlistedGames cart"
    );
    //removing password hash from passed back user and obfuscating email
    const redactedEmail =
      user.email.slice(0, 2) +
      "***" +
      user.email.slice(user.email.indexOf("@"));
    const userData = {
      username: user.username,
      email: redactedEmail,
      reviews: user.reviews,
      ownedGames: user.ownedGames,
      wishlistedGames: user.wishlistedGames,
      cart: user.cart,
      otp_enabled: user.otp_enabled,
      roles: user.roles,
    };
    res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
});

//Put - this will add a free game to the users account
//if the user already owns the game or the game isnt free - the request is rejected

router.put("/buygame/", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const { gameToAdd } = req.body;
  try {
    const user = await User.findById(userId);
    const game = await Game.findById(gameToAdd);
    const gameAlreadyOwned = user.ownedGames.includes(gameToAdd);
    if (gameAlreadyOwned || game.price !== 0) {
      res.status(403).json({ message: "Unable to add game" });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { ownedGames: gameToAdd } },
        { new: true }
      );
      const updatedUserData = {
        username: updatedUser.username,
        email: updatedUser.username,
        reviews: updatedUser.reviews,
        ownedGames: updatedUser.ownedGames,
        wishlistedGames: updatedUser.wishlistedGames,
        cart: updatedUser.cart,
      };
      res.status(200).json(updatedUserData);
    }
  } catch (error) {
    next(error);
  }
});

//PUT - add game to wishlist in User
router.put("/wishlistgame/", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const { gameToAdd } = req.body;
  try {
    const user = await User.findById(userId);
    const alreadyWishlisted = user.wishlistedGames.includes(gameToAdd);
    if (alreadyWishlisted) {
      res.status(403).json({ message: "game already on wishlist" });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { wishlistedGames: gameToAdd } },
        { new: true }
      );
      const updatedUserData = {
        username: updatedUser.username,
        email: updatedUser.username,
        reviews: updatedUser.reviews,
        ownedGames: updatedUser.ownedGames,
        wishlistedGames: updatedUser.wishlistedGames,
        cart: updatedUser.cart,
      };
      res.status(200).json(updatedUserData);
    }
  } catch (error) {
    next(error);
  }
});
//PUT - remove game from wishlist of user
router.put("/removewishlistgame/", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const { gameToRemove } = req.body;
  try {
    const user = await User.findById(userId);
    const gameOnWishlist = user.wishlistedGames.includes(gameToRemove);
    if (gameOnWishlist) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlistedGames: gameToRemove } },
        { new: true }
      );
      const updatedUserData = {
        username: updatedUser.username,
        email: updatedUser.username,
        reviews: updatedUser.reviews,
        ownedGames: updatedUser.ownedGames,
        wishlistedGames: updatedUser.wishlistedGames,
        cart: updatedUser.cart,
      };
      res.status(200).json(updatedUserData);
    } else {
      res.status(403).json({ message: "game is not on wishlist" });
    }
  } catch (error) {
    next(error);
  }
});

//PUT add game to cart

router.put("/addtocart/", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const { gameToAdd } = req.body;
  try {
    const user = await User.findById(userId);
    const alreadyAddedToCart = user.cart.includes(gameToAdd);
    if (alreadyAddedToCart) {
      res.status(403).json({ message: "game already in cart" });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { cart: gameToAdd } },
        { new: true }
      );
      const updatedUserData = {
        username: updatedUser.username,
        email: updatedUser.username,
        reviews: updatedUser.reviews,
        ownedGames: updatedUser.ownedGames,
        wishlistedGames: updatedUser.wishlistedGames,
        cart: updatedUser.cart,
      };
      res.status(200).json(updatedUserData);
    }
  } catch (error) {
    next(error);
  }
});

//PUT remove game from cart

router.put("/removefromcart/", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const { gameToRemove } = req.body;
  try {
    const user = await User.findById(userId);
    const gameInCart = user.cart.includes(gameToRemove);
    if (gameInCart) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { cart: gameToRemove } },
        { new: true }
      );
      const updatedUserData = {
        username: updatedUser.username,
        email: updatedUser.username,
        reviews: updatedUser.reviews,
        ownedGames: updatedUser.ownedGames,
        wishlistedGames: updatedUser.wishlistedGames,
        cart: updatedUser.cart,
      };
      res.status(200).json(updatedUserData);
    } else {
      res.status(403).json({ message: "game is not in cart" });
    }
  } catch (error) {
    next(error);
  }
});

//GET - get roles and id based on a username
router.get("/roles/:username", isAuth, isAdmin, async (req, res, next) => {
  const { username } = req.params;
  try {
    const user = User.findOne({ username });
    res.status(200).json(user.roles);
  } catch (error) {
    next(error);
  }
});

//PUT - admin route to change roles of any user
router.put("/roles/:userId", isAuth, isAdmin, async (req, res, next) => {
  const { userId } = req.params;
  const { newRoles } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { newRoles } },
      { new: true }
    );
    res.status(200).json(updatedUser.roles);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
