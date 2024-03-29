# GameStore API

## Authentication Routes (/auth)

### POST /signup
Sign up a new user.

### POST /login
Login an existing user.

### POST /opt/generate
Generate an OTP (One-Time Password).

### POST /opt/verify
Verify an OTP.

### POST /opt/validate
Validate an OTP.

### POST /opt/disable
Disable OTP for the user.

### POST /verify
Verify user authentication token.

## Games Routes (/api/games)

### GET /
Get all games.

### GET /:gameId
Get details of a specific game.

### GET /dev/:userId
Get games developed by a specific user.

### GET /name/:title
Search for a game by title.

### POST /
Create a new game.

### PUT /:gameId
Update details of a specific game.

### DELETE /:gameId
Delete a specific game.

## Game Schema
```js
    {
    title: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, required: true },
    developer: { type: String, required: true, trim: true },
    publisher: { type: String, required: true, trim: true },
    releaseDate: { type: String, required: true },
    tags: {
      type: [String],
      default: [],
      enum: [
        "Action",
        "Adventure",
        "RPG",
        ...
      ],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Review",
      default: [],
    },
    reviewScore: { type: Number, default: 0 },
    price: { type: Number, required: true },
    discountInPercent: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
    description: { type: String, required: true, trim: true },
    ageRestricted: { type: Boolean, default: false },
  },
```

## Invoices Routes (/api/invoices)

### POST /fulfillinvoice/:orderId
Fulfill an invoice for a specific order.

### GET /user
Get invoices for the authenticated user.

### GET /
Get all invoices.

### GET /dev
Get invoices for developers.

### GET /admin
Get invoices for admins.

##Invoice Schema 
```js
    {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fromOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    }
```

## Review Routes (/api/reviews)

### GET /game/:gameId
Get reviews for a specific game.

### GET /user/:userId
Get reviews by a specific user.

### GET /
Get all reviews.

### GET /:reviewId
Get details of a specific review.

### POST /:gameId
Post a review for a specific game.

### PUT /:reviewId
Update details of a specific review.

### DELETE /:reviewId
Delete a specific review.

## Review Schema
```js
    {
    game: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    recommend: { type: Boolean, required: true },
    comment: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }
```

## User Routes (/api/users)

### GET /:userId
Get details of a specific user.

### PUT /buygame
Buy a game.

### PUT /wishlistgame
Add a game to the wishlist.

### PUT /removewishlistgame
Remove a game from the wishlist.

### PUT /addtocart
Add a game to the shopping cart.

### PUT /removefromcart
Remove a game from the shopping cart.

### GET /roles/:username
Get roles for a specific user by username.

### PUT /roles/:userId
Update roles for a specific user by userId.

## User Schema
```js
    {
    username: { type: String, unique: true, required: true, trim: true },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
      },
    passwordHash: { type: String, required: true },
    }
```
