const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
// Public Ganache "deterministic" account #0 key (test network only, holds no real money)
const DEFAULT_KEY = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const infoPath = path.join(__dirname, "..", "contractInfo.json");

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: ethers.Network.from(1337) });
}
function getInfo() {
  if (!fs.existsSync(infoPath)) throw new Error("Contract not deployed yet. Run: npm start (in project root).");
  return JSON.parse(fs.readFileSync(infoPath, "utf8"));
}
function getContract(provider = getProvider(), sign = true) {
  const info = getInfo();
  const runner = sign ? new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY || DEFAULT_KEY, provider) : provider;
  return new ethers.Contract(info.address, info.abi, runner);
}

// Officer approves -> write hash on chain. Returns tx hash + block number.
async function storeHashOnBlockchain(landId, documentHash) {
  const tx = await getContract().addRecord(landId, documentHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

// Public verify -> read stored hash back from chain.
async function getHashFromBlockchain(landId) {
  const [documentHash, addedBy, timestamp] = await getContract(getProvider(), false).getRecord(landId);
  return { documentHash, addedBy, timestamp: Number(timestamp), contract: getInfo().address };
}

// Every record ever written (append-only history), with real block hashes.
async function getLedger() {
  const provider = getProvider();
  const c = getContract(provider, false);
  const events = await c.queryFilter(c.filters.RecordAdded(), 0, "latest");
  const rows = [];
  for (const e of events) {
    const b = await provider.getBlock(e.blockNumber);
    rows.push({
      blockNumber: e.blockNumber, blockHash: b.hash, parentHash: b.parentHash,
      txHash: e.transactionHash, landId: e.args[0], documentHash: e.args[1],
      recordedBy: e.args[2], timestamp: Number(e.args[3]),
    });
  }
  return rows.reverse();
}

async function health() {
  const out = { chain: false, chainId: null, latestBlock: null, contractDeployed: false, contract: null };
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000));
  try {
    const p = getProvider();
    out.latestBlock = await Promise.race([p.getBlockNumber(), timeout]);
    out.chain = true; out.chainId = 1337;
    const info = getInfo(); out.contract = info.address;
    const code = await p.getCode(info.address);
    out.contractDeployed = !!code && code !== "0x";
  } catch (e) { /* leave flags false */ }
  return out;
}

module.exports = { storeHashOnBlockchain, getHashFromBlockchain, getLedger, health };
