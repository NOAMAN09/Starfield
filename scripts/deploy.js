const hre = require("hardhat");

async function main() {
    const StarfieldGame = await hre.ethers.getContractFactory("StarfieldGame");
    const game = await StarfieldGame.deploy();
    await game.deployed();

    console.log("StarfieldGame deployed to:", game.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });