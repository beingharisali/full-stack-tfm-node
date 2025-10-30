const { connect } = require("mongoose");

async function connectdb() {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI);

    await connect(process.env.MONGO_URI);
    console.log("db connected");
  } catch (error) {
    console.log({ message: error.message });
  }
}

module.exports = connectdb;
