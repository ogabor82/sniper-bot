const {
  WebSocketProvider,
  Contract,
  ContractFactory,
  Wallet,
  parseEther,
  JsonRpcProvider,
} = require("ethers");
require("dotenv").config();
const blockchain = require("./blockchain.json");

//const provider = new WebSocketProvider(process.env.LOCAL_RPC_URL_WS);
const provider = new JsonRpcProvider(process.env.LOCAL_RPC_URL_HTTP);
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider);
const erc20Deployer = new ContractFactory(
  blockchain.erc20Abi,
  blockchain.erc20Bytecode,
  wallet
);

const uniswapFactory = new Contract(
  blockchain.factoryAddress,
  blockchain.factoryAbi,
  wallet
);

const main = async () => {
  const token = await erc20Deployer.deploy(
    "TestToken",
    "TT",
    parseEther("1000000000")
  );
  await token.waitForDeployment();
  console.log(`Test Token deployed at  ${token.target}`);

  const tx = await uniswapFactory.createPair(
    blockchain.WETHAddress,
    token.target
  );
  const receipt = await tx.wait();
  console.log("Test liquity pool depoyed");
};

main();
