require("dotenv").config();
const express = require("express");

const connectdb = require("./config/db");
const { notFound, globalErrorHandler } = require("./middlewares/errorHandler");

const port = process.env.PORT || 5000;
const app = express();
connectdb();

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    msg: "API working",
  });
});

app.use(notFound);

app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Application is up and running on port ${port}`);
});
