const router = require("express").Router();
const { isAuth } = require("../middleware/authentication.middleware");
const Game = require("../models/Game.model");
const Review = require("../models/Review.model");

//GET Routes

//GET reviews for a specific game
router.get("/game/:gameId", async (req, res) => {
  const gameId = req.params.gameId;

  try {
    const gameReviews = await Review.find({ game: gameId });
    console.log(gameReviews);
    res.status(200).json(gameReviews);
  } catch (error) {
    console.log(error);
  }
});
//GET reviews from a specific user
router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const reviews = await Review.find({ createdBy: userId });

    res.status(200).json(reviews);
  } catch (error) {
    console.log(error);
  }
});
//GET all the reviews
router.get("/", async (req, res) => {
  try {
    const reviewList = await Review.find();

    res.status(200).json(reviewList);
  } catch (error) {
    console.log(error);
  }
});
//GET a single review by its ID
router.get("/:reviewId", async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const review = await Review.findById(reviewId);

    res.status(200).json(review);
  } catch (error) {
    console.log(error);
  }
});

//POST
router.post("/:gameId", isAuth, async (req, res) => {
  const payload = req.body;
  const gameId = req.params.gameId;
  const userId = req.tokenPayload.userId;

  try {
    const newReview = await Review.create({
      ...payload,
      game: gameId,
      createdBy: userId,
    });

    await Game.findByIdAndUpdate(gameId, { $push: { reviews: newReview } });

    res.status(201).json(newReview);
  } catch (error) {
    console.log(error);
  }
});

//PUT
router.put("/:reviewId", isAuth, async (req, res) => {
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

        res.status(200).json(editedReview);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
});
//DELETE
router.delete("/:reviewId", isAuth, async (req, res) => {
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
        await Review.findByIdAndDelete(reviewId);

        res.status(204).send();
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
