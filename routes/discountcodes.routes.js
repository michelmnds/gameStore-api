const Discountcode = require("../models/Discountcode.model.js");
const { isAuth } = require("../middleware/authentication.middleware.js");
const router = require("express").Router();

//create new discount code - only admins should be allowed to do that

router.post("/", async (req, res, next) => {
  const { code, discountInPercent, appliesToAlreadyDiscoutedGames } = req.body;
  try {
    const createdCode = await Discountcode.create({
      code,
      discountInPercent,
      appliesToAlreadyDiscoutedGames,
    });
    res.status(200).json(createdCode);
  } catch (error) {
    next(error);
  }
});

//GET to get information about a discount code that was applied in checkout

module.exports = router;
