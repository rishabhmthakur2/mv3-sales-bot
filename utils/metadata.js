const axios = require("axios");

const getIPFSURL = (uri) => {
  return uri.split("://")[1];
};
const fetchMetadata = async (uri) => {
  let ipfsURL = getIPFSURL(uri);
  const metadata = await axios.get(`https://ipfs.io/ipfs/${ipfsURL}`);
  return {
    name: metadata.data.name,
    image: getIPFSURL(metadata.data.image),
  };
};

module.exports = { fetchMetadata };
