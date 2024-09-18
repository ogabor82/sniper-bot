const { WebSocketprovider, Contract } = require("ethers");
require("dotenv").config();
const blockchain = require("./blockchain.jsons");

//const provider  = new WebSocketprovider('wss://mainnet.infura.io/ws/v3/YOUR_INFURA_PROJECT_ID');
const provider = new WebSocketprovider(process.env.LOCAL_RPC_URLS_WS);
const factory = new Contract(
  blockchain.factoryAddress,
  blockchain.factoryAbi,
  provider
);

const init = () => {
  /// https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
  factory.on("PairCreated", async (token0, token1, pairAddress) => {
    console.log(`
      New pair created
      =================
      pairAddress: ${pairAddress}      
      token0: ${token0}
      token1: ${token1}
    `);
  });
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  console.log("Starting bot...");
  init();
  while (true) {
    await timeout(3000);
  }
};

main();
