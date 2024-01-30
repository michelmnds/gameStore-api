const Discountcode = require("../models/Discountcode.model.js");
const {
  isAuth,
  isAdmin,
} = require("../middleware/authentication.middleware.js");
const router = require("express").Router();

//get all discount codes - only admins can do that
router.get("/", isAuth, isAdmin, async (req, res, next) => {
  try {
    const allCodes = await Discountcode.find();
    res.status(200).json(allCodes);
  } catch (error) {
    next(error);
  }
});

//create new discount code - only admins should be allowed to do that

router.post("/", isAuth, isAdmin, async (req, res, next) => {
  const { code, discountInPercent, appliesToAlreadyDiscountedGames } = req.body;
  try {
    const createdCode = await Discountcode.create({
      code,
      discountInPercent,
      appliesToAlreadyDiscountedGames,
    });
    res.status(201).json(createdCode);
  } catch (error) {
    next(error);
  }
});

//Post route to validate discount code
router.post("/validate", async (req, res, next) => {
  const { discountcode } = req.body;
  try {
    const discCode = await Discountcode.findOne({ code: discountcode });
    if (!discCode) {
      res.status(400).json({ message: "bad code" });
    } else {
      res.status(200).json(discCode);
    }
  } catch (error) {
    next(error);
  }
});

//PUT Edit an existing code - should also be admin only - just make sure the correct info is passed
router.put("/:codeId", isAuth, isAdmin, async (req, res, next) => {
  const { codeId } = req.params;
  const payload = req.body;
  try {
    const updatedCode = await Discountcode.findByIdAndUpdate(codeId, payload, {
      new: true,
    });
    res.status(200).json(updatedCode);
  } catch (error) {
    next(error);
  }
});

//Delete

router.delete("/codeId", isAuth, isAdmin, async (req, res, next) => {
  const { codeId } = req.params;
  try {
    await Discountcode.findByIdAndDelete(codeId);
    res.status(204).json();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
