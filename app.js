require("dotenv").config();

const express = require("express");

const app = express();

require("./config")(app);

const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const gameRoutes = require("./routes/games.routes");
app.use("/api/games", gameRoutes);

const reviewRoutes = require("./routes/reviews.routes");
app.use("/api/reviews", reviewRoutes);

const userRoutes = require("./routes/users.routes");
app.use("/api/users", userRoutes);

require("./error-handling")(app);

module.exports = app;
