const app = require("./app");
const withDB = require("./db");

const PORT = process.env.PORT || 5005;

withDB(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});
