import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ethers } from "ethers"

import {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
import verify from "../utils/verify"

const FUND_AMOUNT = ethers.utils.parseEther("1")

const deployCharity: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId || 31337
    const networkConfigItem = networkConfig[chainId]

    let revenueAddress
    if (chainId === 31337) {
        const signers = await ethers.getSigners()
        revenueAddress = signers[1].address
    } else {
        revenueAddress = deployer
    }

    const args = [networkConfigItem.donationFeePercentage, revenueAddress]

    console.log(`deploying to ${network.name}`)

    const charity = await deploy("Charity", {
        from: deployer,
        args: args,
        log: true,
    })

    log("----------------------------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(charity.address, args)
    }
    log("----------------------------------------------------")
}
export default deployCharity
deployCharity.tags = ["all", "charity"]
