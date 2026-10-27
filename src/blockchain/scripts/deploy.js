const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // 1. Get the contract "blueprint"
  const LandDocument = await hre.ethers.getContractFactory("LandDocument");

  // 2. Deploy it to whichever network we run this script with (Ganache)
  const contract = await LandDocument.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LandDocument contract deployed to:", address);

  // 3. Save the contract address + ABI so our backend (Node.js) can use it.
  // ABI = the "instructions" that tell Ethers.js what functions the contract has.
  const artifact = await hre.artifacts.readArtifact("LandDocument");

  const contractInfo = {
    address: address,
    abi: artifact.abi,
  };

  fs.writeFileSync(
    "../backend/contractInfo.json",
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Saved contract address + ABI to backend/contractInfo.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
