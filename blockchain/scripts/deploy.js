const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Land = await hre.ethers.getContractFactory("LandRegistry");
  const land = await Land.deploy();
  await land.waitForDeployment();
  const address = await land.getAddress();

  const artifact = await hre.artifacts.readArtifact("LandRegistry");
  const out = path.join(__dirname, "..", "..", "backend", "contractInfo.json");
  fs.writeFileSync(out, JSON.stringify({ address, abi: artifact.abi }, null, 2));
  console.log("LandRegistry deployed at:", address);
  console.log("Saved to:", out);
}

main().catch((e) => { console.error(e); process.exit(1); });
