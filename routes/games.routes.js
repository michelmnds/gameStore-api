const router = require("express").Router();
const { isAuth } = require("../middleware/authentication.middleware");
const Game = require("../models/Game.model");

//GET Routes
router.get("/", async (req, res) => {
  try {
    const gameList = await Game.find();

    res.status(200).json(gameList);
  } catch (error) {
    console.log(error);
  }
});
router.get("/:gameId", async (req, res) => {
  const gameId = req.params.gameId;

  try {
    const game = await Game.findById(gameId);

    res.status(200).json(game);
  } catch (error) {
    console.log(error);
  }
});

//POST Routes
router.post("/", isAuth, async (req, res) => {
  const payload = req.body;
  const userId = req.tokenPayload.userId;

  try {
    const newGame = await Game.create({ ...payload, createdBy: userId });

    res.status(201).json(newGame);
  } catch (error) {
    console.log(error);
  }
});

//PUT Route
router.put("/:gameId", isAuth, async (req, res) => {
  const gameId = req.params.gameId;
  const payload = req.body;

  try {
    const patchedGame = await Game.findByIdAndUpdate(gameId, payload, {
      new: true,
    });

    res.status(200).json(patchedGame);
  } catch (error) {
    console.log(error);
  }
});

//DELETE Route
router.delete("/:gameId", isAuth, async (req, res) => {
  const gameId = req.params.gameId;

  try {
    await Game.findByIdAndDelete(gameId);

    res.status(204).send();
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
