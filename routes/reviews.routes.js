const router = require("express").Router();
const { isAuth } = require("../middleware/authentication.middleware");
const Game = require("../models/Game.model");
const Review = require("../models/Review.model");
const User = require("../models/User.model");

//helper function to calculate games average review score anytime reviews are edited in any ways
//calculates average positive reviews
//const newAverage = calculatePosiviteReviews(gameId);
//await Game.findByIdAndUpdate(gameId, { reviewScore: newAverage });
const calculatePosiviteReviews = async (gameId) => {
  try {
    const game = await Game.findById(gameId).populate("reviews");
    const counter = game.reviews.reduce(
      (acc, review) => {
        acc.total += 1;
        if (review.recommend === true) acc.posivite += 1;
        return acc;
      },
      { posivite: 0, total: 0 }
    );
    let positivePercent = counter.posivite / counter.total;
    if (counter.total === 0) {
      positivePercent = 0;
    }
    return positivePercent;
  } catch (error) {
    next(error);
  }
};

//GET Routes

//GET reviews for a specific game
router.get("/game/:gameId", async (req, res, next) => {
  const gameId = req.params.gameId;

  try {
    const gameReviews = await Review.find({ game: gameId });
    res.status(200).json(gameReviews);
  } catch (error) {
    next(error);
  }
});
//GET reviews from a specific user
router.get("/user/:userId", isAuth, async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const reviews = await Review.find({ createdBy: userId }).populate("game");

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
});
//GET all the reviews
router.get("/", async (req, res, next) => {
  try {
    const reviewList = await Review.find();

    res.status(200).json(reviewList);
  } catch (error) {
    next(error);
  }
});
//GET a single review by its ID
router.get("/:reviewId", async (req, res, next) => {
  const reviewId = req.params.reviewId;

  try {
    const review = await Review.findById(reviewId);

    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
});

//POST
router.post("/:gameId", isAuth, async (req, res, next) => {
  const payload = req.body;
  const gameId = req.params.gameId;
  const userId = req.tokenPayload.userId;

  try {
    //checking if user owns the game and making sure they didnt review this game yet
    const user = await User.findById(userId);
    const alreadyReviewed = await Review.find({
      createdBy: userId,
      game: gameId,
    });
    const gameOwned = user.ownedGames.includes(gameId);

    if (!gameOwned || alreadyReviewed.length !== 0) {
      res
        .status(403)
        .json({ message: "Must own the game or already reviewed this game" });
    } else {
      const newReview = await Review.create({
        ...payload,
        game: gameId,
        createdBy: userId,
      });

      await Game.findByIdAndUpdate(gameId, { $push: { reviews: newReview } });

      const newAverage = await calculatePosiviteReviews(gameId);

      await Game.findByIdAndUpdate(gameId, { reviewScore: newAverage });

      await User.findByIdAndUpdate(userId, { $push: { reviews: newReview } });

      res.status(201).json(newReview);
    }
  } catch (error) {
    next(error);
  }
});

//PUT
router.put("/:reviewId", isAuth, async (req, res, next) => {
  const userId = req.tokenPayload.userId;
  const reviewId = req.params.reviewId;
  const payload = req.body;

  try {
    const review = await Review.findById(reviewId);

    if (userId != review.createdBy) {
      res.status(403).json({ error: "Users can only edit their own reviews" });
    } else {
      try {
        const editedReview = await Review.findByIdAndUpdate(reviewId, payload, {
          new: true,
        });
        const newAverage = await calculatePosiviteReviews(editedReview.game);
        await Game.findByIdAndUpdate(editedReview.game, {
          reviewScore: newAverage,
        });
        res.status(200).json(editedReview);
      } catch (error) {
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
});
//DELETE
router.delete("/:reviewId", isAuth, async (req, res, next) => {
  const userId = req.tokenPayload.userId;
  const reviewId = req.params.reviewId;

  try {
    const review = await Review.findById(reviewId);

    if (userId != review.createdBy) {
      res
        .status(403)
        .json({ error: "Users can only delete their own reviews" });
    } else {
      try {
        const { game } = await Review.findById(reviewId);
        await Review.findByIdAndDelete(reviewId);

        await User.updateMany(
          { reviews: reviewId },
          { $pull: { reviews: reviewId } }
        );

        await Game.updateMany(
          { reviews: reviewId },
          { $pull: { reviews: reviewId } }
        );

        const newAverage = await calculatePosiviteReviews(game);
        await Game.findByIdAndUpdate(game, {
          reviewScore: newAverage,
        });

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
