require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const app = express();
const cors = require("cors");

const connectdb = require("./config/db");

const port = process.env.PORT || 5000;
connectdb();

app.use(express.json());

app.use(cors({}));
app.use("/api/auth", authRoutes);

app.listen(port, () => {
	console.log(`Application is up and running on port ${port}`);
});
