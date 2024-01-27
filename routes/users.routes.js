const User = require("../models/User.model.js");
const { isAuth } = require("../middleware/authentication.middleware.js");
const router = require("express").Router();

//get user by ID

router.get("/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;
  //COULD populate user.games and user.ownergames if we want
  try {
    const user = await User.findById(userId).populate(
      "ownedGames reviews wishlistedGames"
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
      otp_verified: user.otp_verified,
    };
    res.status(200).json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong fetching a user" });
  }
});

//Put - update user: add purchased game

router.put("/buygame/:userId", isAuth, async (req, res) => {
  //need to make this more secure later, so it checks if there was a purchase
  //for now this will do
  const { userId } = req.params;
  const { gameToAdd } = req.body;
  try {
    const user = await User.findById(userId);
    const gameAlreadyOwned = user.ownedGames.includes(gameToAdd);
    if (gameAlreadyOwned) {
      res.status(403).json({ message: "game already owned" });
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
      };
      res.status(200).json(updatedUserData);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong adding a game" });
  }
});

//PUT - add game to wishlist in User
router.put("/wishlistgame/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;
  const { gameToAdd } = req.body;
  try {
    const user = await User.findById(userId);
    const alreadyWishlisted = user.wishlistedGames.includes(gameToAdd);
    if (alreadyWishlisted) {
      res.status(403).json({ message: "game already owned" });
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
      };
      res.status(200).json(updatedUserData);
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "something went wrong wishlisting a game" });
  }
});
//PUT - remove game from wishlist of user
router.put("/removewishlistgame/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;
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
      };
      res.status(200).json(updatedUserData);
    } else {
      res.status(403).json({ message: "game is not on wishlist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "something went wrong removing the game from your wishlist",
    });
  }
});
module.exports = router;
