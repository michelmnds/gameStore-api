const router = require("express").Router();

router.get("/", (req, res) => {
  res.json("Healthcheck successful");
});

module.exports = router;
