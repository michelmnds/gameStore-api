# GameStore API

GameStore is an API for managing user authentication, invoices, reviews, and user-related actions.

## Authentication Routes

### /auth

- POST /signup
- POST /login
- POST /opt/generate
- POST /opt/verify
- POST /opt/validate
- POST /opt/disable
- POST /verify

## Invoices Routes

### /api/invoices

- POST /fulfillinvoice/:orderId
- GET /user
- GET /
- GET /dev
- GET /admin

## Review Routes

### /api/reviews

- GET /game/:gameId
- GET /user/:userId
- GET /
- GET /:reviewId
- POST /:gameId (post review to a game)
- PUT /:reviewId
- DELETE /:reviewId

## User Routes

### /api/users

- GET /:userId
- PUT /buygame
- PUT /wishlistgame
- PUT /removewishlistgame
- PUT /addtocart
- PUT /removefromcart
- GET /roles/:username
- PUT /roles/:userId
