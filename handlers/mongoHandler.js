const { MongoClient, ServerApiVersion } = require("mongodb");

// Environment file used to host API keys
const dotenv = require("dotenv");
require("dotenv").config();

// Setting up connection config for MongoDB
const uri = process.env.MONGO_URL;
const mongoClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const getCollection = async () => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db("mv3");
    const collection = database.collection("mv3-sales");
    return collection;
  } catch (e) {
    console.error(e);
  }
};

const checkDataDuplicate = async (from, to, timestamp) => {
  try {
    const collection = await getCollection();
    console.log({ collection });
    // Checking if the there was a sync error and the same transaction already exists in the databse
    const previousRecords = await collection.findOne({
      from,
      to,
      timestamp,
    });
    if (previousRecords == undefined) {
      return false;
    } else {
      console.log(`Transaction is a duplicate`);
      return true;
    }
  } catch (e) {
    console.error(e);
  }
};

const insertRecordToMongo = async (message) => {
  try {
    const collection = await getCollection();
    const newRecord = await collection.insertOne(message);
    console.log({ newRecord });
    return newRecord;
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  checkDataDuplicate,
  insertRecordToMongo,
};
