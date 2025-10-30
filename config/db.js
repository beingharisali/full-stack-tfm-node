const { connect } = require("mongoose");

async function connectdb() {
  try {
    await connect("mongodb://127.0.0.1:27017/tfmDB");
    console.log("db connected");
  } catch (error) {
    console.log({ message: error.message });
  }
}

module.exports = connectdb;
