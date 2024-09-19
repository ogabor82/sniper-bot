const { WebSocketProvider, Wallet, Contract } = require("ethers");
require("dotenv").config();
const blockchain = require("./blockchain.json");
const fs = require("fs");
const { parse } = require("path");

//const provider  = new WebSocketprovider('wss://mainnet.infura.io/ws/v3/YOUR_INFURA_PROJECT_ID');
const provider = new WebSocketProvider(process.env.LOCAL_RPC_URL_WS);
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider);
const factory = new Contract(
  blockchain.factoryAddress,
  blockchain.factoryAbi,
  provider
);

// https://github.com/Uniswap/v2-periphery/blob/master/contracts/UniswapV2Router02.sol#L224
const router = new Contract(
  blockchain.routerAddress,
  blockchain.routerAbi,
  wallet
);

const SNIPE_LIST_FILE = "snipe_list.csv";
const TOKEN_LIST_FILE = "token_list.csv";

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
    // save this into a file
    if (
      token0 === blockchain.WETHAddress ||
      token1 === blockchain.WETHAddress
    ) {
      const t0 = token0 === blockchain.WETHAddress ? token0 : token1;
      const t1 = token0 === blockchain.WETHAddress ? token1 : token0;
      fs.appendFileSync(SNIPE_LIST_FILE, `${pairAddress},${t0},${t1}\n`);

      // send email with sendgrid API
      // send the info too a google sheet
    }
  });
};

const snipe = async () => {
  console.log("Snipe loop");
  let snipeList = fs.readFileSync(SNIPE_LIST_FILE);
  snipeList = snipeList
    .toString()
    .split("\n")
    .filter((snipe) => snipe !== "");
  if (snipeList.length === 0) {
    console.log("No snipe list");
    return;
  }
  for (const snipe of snipeList) {
    const [pairAddress, wethAddress, tokenAddress] = snipe.split(",");
    console.log(`Trying to snipe ${tokenAddress} on ${pairAddress}`);

    const pair = new Contract(pairAddress, blockchain.pairAbi, wallet);
    const totalSupply = await pair.totalSupply(); // LP token
    if (totalSupply === 0n) {
      console.log("Pool is empty, snipe cancelled");
      continue;
    }

    // there is some liquidity, let's snipe
    const tokenIn = wethAddress;
    const tokenOut = tokenAddress;

    // we buy 0.1 WETH worth of token
    const amountIn = parseEther("0.1");
    const amounts = await router.getAmounstOut(amountIn, [tokenIn, tokenOut]);
    // let's define the price tolerance
    const amountOutMin = amounts[1] - (amount[1] * 5n) / 100n; // 5% slippage
    console.log(`
      Buying new token
      =================
      tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
      tokenOut: ${amountOutMin.toString()} ${tokenOut}
      `);

    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      [tokenIn, tokenOut],
      blockchain.recipient,
      Date.now() + 1000 * 60 * 10 // 10 minutes
    );

    const receipt = await tx.wait();
    console.log(`Transaction receipt: ${receipt}`);
    if (receipt.status === 1) {
      // 1. add it to the list of tokes bought
      fs.appendFileSync(
        TOKEN_LIST_FILE,
        `${receipt.blockNumber},${wethAddress},${tokenAddress},${
          amountOutMin / amountIn
        }\n`
      );
      // 2. remove it from the snipeList
    }
  }
};

const managePosition = async () => {
  // 1. stop loss
  // 2. take profit
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  console.log("Starting bot...");
  init();
  while (true) {
    console.log("Heartbeat...");
    await snipe();
    await managePosition();
    await timeout(3000);
  }
};

main();
