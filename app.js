require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    msg: "API working",
  });
});

app.listen(port, () => {
  console.log(`Application is up and running on port ${port}`);
});
