const Game = require("../models/Game.model");
const Order = require("../models/Order.model.js");
const Discountcode = require("../models/Discountcode.model.js");
const { isAuth } = require("../middleware/authentication.middleware.js");
const router = require("express").Router();

//helper function to format games to what we store in the DB
const formatPurchasedGames = (items) => {
  const formattedItems = items.map((game) => {
    const formattedGame = {
      gameId: game._id,
      defaultPriceInEuroCent: game.price,
      discountPercentApplied: game.discountInPercent,
    };
    return formattedGame;
  });
  return formattedItems;
};

//helper function to add all default prices to store in order
const calculateTotalBeforeDiscount = (formattedItems) => {
  const totalBefDisc = formattedItems.reduce((total, item) => {
    return total + item.defaultPriceInEuroCent;
  }, 0);
  return totalBefDisc;
};

//helper function to apply all discounts
//both individual and by discount code
const calculateTotalAfterDiscount = (formattedItems, discountToApply) => {
  let discountInPercent = 0;
  let appliesToAlreadyDiscountedGames = false;
  //check that discount code is valid and not empty
  if (discountToApply) {
    discountInPercent = discountToApply.discountInPercent;
    appliesToAlreadyDiscountedGames =
      discountToApply.appliesToAlreadyDiscountedGames;
  }

  const totalAfterDisc = formattedItems.reduce((total, item) => {
    let priceToAdd;
    // case no discount
    if (item.discountPercentApplied === 0 && !discountInPercent) {
      priceToAdd = item.defaultPriceInEuroCent;
    }
    // case only item OR both but doesnt apply
    if (
      item.discountPercentApplied > 0 &&
      (!discountInPercent || !appliesToAlreadyDiscountedGames)
    ) {
      priceToAdd =
        item.defaultPriceInEuroCent * (1 - item.discountPercentApplied / 100);
    }
    // case only code
    if (item.discountPercentApplied === 0 && discountInPercent > 0) {
      priceToAdd = item.defaultPriceInEuroCent * (1 - discountInPercent / 100);
    }
    // case BOTH , compound discounting => first applying game specific discount, then applying the code
    if (
      item.discountPercentApplied > 0 &&
      discountInPercent > 0 &&
      appliesToAlreadyDiscountedGames
    ) {
      priceToAdd =
        item.defaultPriceInEuroCent *
        (1 - item.discountPercentApplied / 100) *
        (1 - discountInPercent / 100);
    }

    return total + priceToAdd;
  }, 0);
  return +totalAfterDisc.toFixed(0);
};

//POST - new purchase created
//needs to do calculations for prices/discounts here - get data from discount DB to match code
//to % and store totalprice - specify what we need to get from the frontend here

//dont forget to add isAuth once route is tested
//this post route expects to receive an array of game ids and a discount code
router.post("/processpurchase", isAuth, async (req, res, next) => {
  const { games, discountCode } = req.body;
  const { userId } = req.tokenPayload;
  try {
    const items = await Game.find(
      {
        _id: { $in: games.map((id) => id) },
      },
      "_id price discountInPercent"
    );
    //check if order has any valid ids in it
    if (items.length === 0) {
      res.status(400).json({ message: "Order is empty" });
    }

    //attach user id to createdBy prop
    const createdBy = userId;

    //format games to match order model
    const formattedItems = formatPurchasedGames(items);

    //calculate raw price
    const totalInEuroCentBeforeDiscount =
      calculateTotalBeforeDiscount(formattedItems);

    //discount calculation
    let discountToApply;
    let totalInEuroCentAfterDiscount;
    if (discountCode !== "") {
      //get discount information from DB
      discountToApply = await Discountcode.findOne({
        code: discountCode,
      });
    } else {
      discountToApply = { discountInPercent: 0 };
    }

    //set discountpercent to 0 incase invalid code was provided
    if (!discountToApply) {
      discountToApply = { discountInPercent: 0 };
    }
    //calculate all the discounts
    totalInEuroCentAfterDiscount = calculateTotalAfterDiscount(
      formattedItems,
      discountToApply
    );

    const createdOrder = await Order.create({
      items: formattedItems,
      createdBy,
      status: "SUCCESS",
      totalInEuroCentBeforeDiscount,
      totalInEuroCentAfterDiscount,
      discountcode: discountCode,
      discountCodePercentage: discountToApply.discountInPercent,
    });

    res.status(200).json(createdOrder);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
