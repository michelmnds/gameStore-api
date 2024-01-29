const User = require("../models/User.model.js");
const { isAuth } = require("../middleware/authentication.middleware.js");
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
router.get("/", isAuth, async (req, res, next) => {
  try {
    const adminInvoices = await Invoice.find()
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

module.exports = router;
