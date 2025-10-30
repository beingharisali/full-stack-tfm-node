require("dotenv").config();
const express = require("express");
const app = express();

const connectdb = require("./config/db");

const port = process.env.PORT || 5000;
connectdb();

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    msg: "API working",
  });
});

app.listen(port, () => {
  console.log(`Application is up and running on port ${port}`);
});
