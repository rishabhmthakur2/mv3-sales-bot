const axios = require("axios");

const getIPFSURL = (uri) => {
  const urlParts = uri.split("://");
  return urlParts[0], urlParts[1];
};
const fetchMetadata = async (uri) => {
  let prefix,
    ipfsURL = getIPFSURL(uri);
  let metadata = "";
  if (prefix === "ipfs") {
    metadata = await axios.get(`https://ipfs.io/ipfs/${ipfsURL}`);
  } else {
    metadata = await axios.get(uri);
  }
  return {
    name: metadata.data.name,
    image:
      prefix === "ipfs"
        ? `https://ipfs.io/ipfs/${getIPFSURL(metadata.data.image)}`
        : metadata.data.image,
  };
};

module.exports = { fetchMetadata };
