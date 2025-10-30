require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Application is up and running on port ${port}`);
});
