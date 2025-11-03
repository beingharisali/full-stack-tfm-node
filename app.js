require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const app = express();

const connectdb = require("./config/db");
const { notFound, globalErrorHandler } = require("./middlewares/errorHandler");

const port = process.env.PORT || 5000;
connectdb();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(notFound);

app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Application is up and running on port ${port}`);
});
