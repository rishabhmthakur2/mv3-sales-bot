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

const getConnection = async () => {
  try {
    return await mongoClient.connect();
  } catch (e) {
    console.error(e);
  }
};

const getCollection = async (mongoClient) => {
  try {
    const database = mongoClient.db("mv3");
    const collection = database.collection("mv3-sales");
    return collection;
  } catch (e) {
    console.error(e);
  }
};

const checkDataDuplicate = async (mongoClient, from, to, timestamp, txHash) => {
  try {
    const collection = await getCollection(mongoClient);
    // Checking if the there was a sync error and the same transaction already exists in the databse
    const previousRecords = await collection.findOne({
      from,
      to,
      timestamp,
      txHash,
    });
    if (previousRecords == undefined) {
      return false;
    } else {
      console.log({ message: `Transaction is a duplicate` });
      return true;
    }
  } catch (e) {
    console.error(e);
  }
};

const insertRecordToMongo = async (mongoClient, message) => {
  try {
    const collection = await getCollection(mongoClient);
    const newRecord = await collection.insertOne(message);
    return newRecord;
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  checkDataDuplicate,
  insertRecordToMongo,
  getConnection,
};
