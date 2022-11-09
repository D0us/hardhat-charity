export interface networkConfigItem {
    name?: string
    donationFeePercentage: string
    revenueAddress?: string
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    31337: {
        name: "localhost",
        donationFeePercentage: "10",
        // use signers[1] for revenueaddress
    },
    5: {
        name: "goerli",
        donationFeePercentage: "10",
        revenueAddress: "",
    },
    1: {
        name: "mainnet",
        donationFeePercentage: "10",
        revenueAddress: "",
    },
}

export const developmentChains = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
export const frontEndAddressFile = "../website/src/constants/contractAddresses.json"
export const frontEndAbiFile = "../website/src/constants/abi.json"
