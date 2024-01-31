const User = require("../models/User.model.js");
const {
  isAuth,
  isAdmin,
  isDev,
} = require("../middleware/authentication.middleware.js");
const Invoice = require("../models/Invoice.model.js");
const Order = require("../models/Order.model.js");
const router = require("express").Router();

//function to add purchased games to users account and empty their cart
const fulfillOrder = async (gamesToAdd, userId) => {
  const gameIdsToAdd = gamesToAdd.map((game) => game.gameId);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { ownedGames: { $each: gameIdsToAdd } },
        $set: { cart: [] },
      },
      { new: true }
    );
    const updatedUserData = {
      username: updatedUser.username,
      email: updatedUser.username,
      reviews: updatedUser.reviews,
      ownedGames: updatedUser.ownedGames,
      cart: updatedUser.cart,
      wishlistedGames: updatedUser.wishlistedGames,
    };
    return updatedUserData;
  } catch (error) {
    next(error);
  }
};
//post to confirm order was successful and create invoice

router.post("/fulfillinvoice/:orderId", async (req, res, next) => {
  const { orderId } = req.params;
  try {
    //check if there already was an invoice created for this user
    const existingInvoice = await Invoice.find({ fromOrder: orderId });
    if (existingInvoice.length !== 0) {
      res.status(400).json({ message: "Invoice already exists" });
    }
    //then get the order and check if it was successful
    const relatedOrder = await Order.findById(orderId);
    if (!relatedOrder || !relatedOrder.status === "SUCCESS") {
      res
        .status(400)
        .json({ message: "Invoice not found or Order not completed yet" });
    } else {
      //create invoice here as all checks are passed
      const createdInvoice = await Invoice.create({
        createdBy: relatedOrder.createdBy,
        fromOrder: orderId,
      });

      //fullfil games here
      await fulfillOrder(relatedOrder.items, relatedOrder.createdBy);
      res.status(200).json(createdInvoice);
    }
  } catch (error) {
    next(error);
  }
});

//get user id - find all invoices and populate with relevant order fields (esp game name)
//for display on userpage
//this nested populate is cursed so check carefully what you need to render on the frontend
router.get("/user", isAuth, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  try {
    const userInvoices = await Invoice.find({ createdBy: userId })
      .populate({
        path: "fromOrder",
        populate: {
          path: "items.gameId",
          select: "title imageUrl",
        },
      })
      .sort({ createdAt: -1 });
    res.status(200).json(userInvoices);
  } catch (error) {
    next(error);
  }
});

//get individual invoice by id
router.get("/user/:invoiceId", isAuth, async (req, res, next) => {
  const { invoiceId } = req.params;
  try {
    const invoice = await Invoice.findById(invoiceId).populate({
      path: "fromOrder",
      populate: {
        path: "items.gameId",
        select: "title imageUrl",
      },
    });
    //should add check if user checking this is the creator of the invoice
    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
});

//get all invoices, guarded admin route for dashboard: should show only id, total, discount, userID and maybe games
router.get("/", isAuth, isAdmin, async (req, res, next) => {
  try {
    const adminInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate([
        {
          path: "fromOrder",
          select:
            "totalInEuroCentAfterDiscount currency discountCodePercentage items status",
        },
        { path: "createdBy", select: "username" },
      ])
      .sort({ createdAt: -1 });

    const formattedInvoices = adminInvoices.map((invoice) => {
      return {
        _id: invoice._id,
        createdBy: invoice.createdBy.username,
        items: invoice.fromOrder.items.length,
        totalInEuroCentAfterDiscount:
          invoice.fromOrder.totalInEuroCentAfterDiscount,
        currency: invoice.fromOrder.currency,
        discountCodePercentage: invoice.fromOrder.discountCodePercentage,
        status: invoice.fromOrder.status,
      };
    });
    res.status(200).json(formattedInvoices);
  } catch (error) {
    next(error);
  }
});

//get total of last 7 days for dev of game //return number of sold games AND sum
// add back once testing is over
router.get("/dev", isAuth, isDev, async (req, res, next) => {
  const { userId } = req.tokenPayload;
  const lastThirtyDays = new Date();
  lastThirtyDays.setDate(lastThirtyDays.getDate() - 30);
  try {
    const allTime = await Invoice.find().populate({
      path: "fromOrder",
      model: "Order",
      populate: {
        path: "items.gameId",
        model: "Game",
      },
    });
    const ThirtyDays = await Invoice.find({
      createdAt: { $gte: lastThirtyDays },
    }).populate({
      path: "fromOrder",
      model: "Order",
      populate: {
        path: "items.gameId",
        model: "Game",
      },
    });
    //filters sum up total revenue - store obviously takes 30% of the sale prices because thats how we make money :)
    const devPercentage = 0.7;
    const sumAllTimeByDev = allTime.reduce(
      (acc, inv) => {
        inv.fromOrder.items.map((item) => {
          if (item.gameId.createdBy == userId) {
            acc.count += 1;
            acc.sum += item.finalItemPrice * devPercentage;
            console;
          }
        });
        return acc;
      },
      { sum: 0, count: 0 }
    );

    const sumThirtyDaysDev = ThirtyDays.reduce(
      (acc, inv) => {
        inv.fromOrder.items.map((item) => {
          if (item.gameId.createdBy == userId) {
            acc.count += 1;
            acc.sum += item.finalItemPrice * devPercentage;
            console;
          }
        });
        return acc;
      },
      { sum: 0, count: 0 }
    );

    res.status(200).json({ sumAllTimeByDev, sumThirtyDaysDev });
  } catch (error) {
    next(error);
  }
});

//get total of last 7 days of entire website
router.get("/admin", isAuth, isAdmin, async (req, res, next) => {
  const lastThirtyDays = new Date();
  lastThirtyDays.setDate(lastThirtyDays.getDate() - 30);
  try {
    const invAllTime = await Invoice.find().populate({
      path: "fromOrder",
      select: "totalInEuroCentAfterDiscount",
    });
    const invLastThirtyDays = await Invoice.find({
      createdAt: { $gte: lastThirtyDays },
    }).populate({
      path: "fromOrder",
      select: "totalInEuroCentAfterDiscount",
    });
    const sumAllTime = invAllTime.reduce((acc, inv) => {
      acc += inv.fromOrder.totalInEuroCentAfterDiscount;
      return acc;
    }, 0);
    const sumThirtyDays = invLastThirtyDays.reduce((acc, inv) => {
      acc += inv.fromOrder.totalInEuroCentAfterDiscount;
      return acc;
    }, 0);
    res.status(200).json({ sumAllTime, sumThirtyDays });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
