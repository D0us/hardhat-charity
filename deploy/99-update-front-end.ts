import { ethers, network } from "hardhat"
import * as fs from "fs"
import { frontEndAddressFile, frontEndAbiFile } from "../helper-hardhat-config"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating front end")
    }
    await updateContractAddresses()
    await updateAbi()
}

async function updateAbi() {
    const charity = await ethers.getContract("Charity")
    fs.writeFileSync(
        frontEndAbiFile,
        charity.interface.format(ethers.utils.FormatTypes.json).toString()
    )
}

async function updateContractAddresses() {
    const charity = await ethers.getContract("Charity")

    let currentAddresses
    if (fs.existsSync(frontEndAddressFile)) {
        currentAddresses = JSON.parse(fs.readFileSync(frontEndAddressFile, "utf8"))
    } else {
        currentAddresses = {}
    }

    const chainId: string | undefined = network.config.chainId?.toString()

    if (!chainId) {
        console.log("No chain Id set")
        process.exit(0)
    }
    console.log("next")

    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(charity.address)) {
            currentAddresses[chainId].push(charity.address)
        }
    } else {
        currentAddresses[chainId] = [charity.address]
    }
    fs.writeFileSync(frontEndAddressFile, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
