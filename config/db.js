const mongoose = require("mongoose");

async function connectdb() {
	try {
		await mongoose.connect(`${process.env.MONGO_URI}`);
		console.log("Connected to database");
	} catch (error) {
		console.log({ message: error.message });
	}
}

module.exports = connectdb;
