import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { BigNumber, Signer } from "ethers"
import { network, deployments, ethers } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { Charity } from "../../typechain-types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Charity Unit Tests", function () {
          let charityContract: Charity
          //   let donationFeePercentage: BigNumber

          let revenueAddress: string
          let signers: SignerWithAddress[]
          let deployerAddress: string
          beforeEach(async () => {
              await deployments.fixture(["all", "charity"])
              charityContract = await ethers.getContract("Charity")
              signers = await ethers.getSigners()
              deployerAddress = signers[0].address
              revenueAddress = signers[1].address
          })

          describe("constructor", function () {
              it("sets the revenue address correctly", async () => {
                  const contractRevenueAddress = await charityContract.getRevenueAddress()
                  expect(contractRevenueAddress).to.equal(revenueAddress)
              })
              //   it("sets the donate fee correctly", async () => {
              //   const contractDonationFeePercentage = await charityContract.getDonationFee()

              //   expect(contractDonationFeePercentage.toString()).to.equal(
              //       donationFeePercentage.toString()
              //   )
              //   })
          })

          describe("several users donate", function () {
              let totalEthDonated: BigNumber = BigNumber.from(0)
              let donorsToDonations: BigNumber[] = []
              let numberOfDonors = 10
              beforeEach(async () => {
                  for (let i = 2; i < 2 + numberOfDonors; i++) {
                      const donationAmount = ethers.utils.parseEther(Math.random().toString())
                      donorsToDonations[i] = donationAmount
                      await charityContract.donate({
                          value: donationAmount,
                      })
                      totalEthDonated = totalEthDonated.add(donationAmount)
                  }
              })

              it("receives all donations", async () => {
                  const balanceContract = await charityContract.provider.getBalance(
                      charityContract.address
                  )
                  assert.equal(balanceContract.toString(), totalEthDonated.toString())
              })

              it("sends the correct amount to all recipients", async () => {
                  const txResponse = await charityContract.sendDonations()
                  const txReceipt = await txResponse.wait(1)
                  const donationFeePercentage = await charityContract.getDonationFee()

                  const totalFee = totalEthDonated.mul(donationFeePercentage).div(100)
                  const amountPerRecipient = totalEthDonated.sub(totalFee).div(numberOfDonors)

                  for (let i = 2; i < 2 + numberOfDonors; i++) {
                      //   const donationAmount = donorsToDonations[i]
                      //   if (typeof txReceipt.events !== "undefined") {
                      //       const txEvent = txReceipt.events.find(
                      //           (event) => event.event === "DonationSent"
                      //       )
                      //       const txEventDonationAmount = txEvent.args[1]
                      //   assert.equal(donationAmount.toString(), txEventDonationAmount.toString())
                      //   }
                  }
              })
          })
      })
