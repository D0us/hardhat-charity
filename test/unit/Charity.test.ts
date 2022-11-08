import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { BigNumber, ContractReceipt, ContractTransaction, Signer } from "ethers"
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

          describe("Users sign up to receive", function () {
              it("adds a reciepient", async () => {
                  const recipientAddress = signers[2].address
                  await charityContract.addRecipient(recipientAddress)
                  const users = await charityContract.getRecipients()
                  expect(users[0]).to.equal(recipientAddress)
              })
          })

          describe("A donor dontates", function () {
              it("Adds the donation funds", async () => {
                  const donationAmount = ethers.utils.parseEther("1")
                  const charityConnected = await charityContract.connect(signers[2])
                  await charityConnected.donate({ value: donationAmount })
                  const donationBalance = await charityContract.provider.getBalance(
                      charityContract.address
                  )
                  expect(donationBalance.toString()).to.equal(donationAmount.toString())
              })
          })

          describe("A 1 to 1 donation", function () {
              let donationAmount: BigNumber, recipientBalanceBeforeDonation: BigNumber
              beforeEach(async () => {
                  donationAmount = ethers.utils.parseEther("1")
                  const charityConnected = await charityContract.connect(signers[2])
                  await charityConnected.donate({ value: donationAmount })

                  const recipient = signers[3]
                  recipientBalanceBeforeDonation = await recipient.getBalance()
                  charityContract.connect(deployerAddress)
                  await charityContract.addRecipient(recipient.address)
                  await charityContract.sendDonations()
              })
              it("Contract balance is 0 after donation", async () => {
                  const contractBalanceAfterDonation = await charityContract.provider.getBalance(
                      charityContract.address
                  )
                  assert(contractBalanceAfterDonation.eq(0))
              })
              it("Recipient balance correct after donation", async () => {
                  // balance should be donation amount - fee
                  const feePercentage = await charityContract.getDonationFee()
                  const fee = donationAmount.mul(feePercentage).div(100)

                  const recipient = signers[3]
                  const balanceAfterDonation = await charityContract.provider.getBalance(
                      recipient.address
                  )

                  const expected = donationAmount.sub(fee).add(recipientBalanceBeforeDonation)
                  assert.equal(balanceAfterDonation.toString(), expected.toString())
              })
          })

          describe("several users donate", function () {
              let totalEthDonated: BigNumber = BigNumber.from(0)
              let donorsToDonations: BigNumber[] = []
              let numberOfDonors = 3
              let numberOfRecipients = 2
              let recipientBalancesBeforeDonation: BigNumber[] = []
              before(async () => {
                  // Add donors
                  for (let i = 2; i < 2 + numberOfDonors; i++) {
                      //   const donationAmount = ethers.utils.parseEther(Math.random().toString())
                      const donationAmount = ethers.utils.parseEther("1")
                      donorsToDonations[i] = donationAmount
                      await charityContract.donate({
                          value: donationAmount,
                      })
                      totalEthDonated = totalEthDonated.add(donationAmount)
                  }

                  //   Add recipients
                  for (
                      let i = 2 + numberOfDonors;
                      i < 2 + numberOfDonors + numberOfRecipients;
                      i++
                  ) {
                      const recipientAddress = signers[i].address
                      const recipientBalance = await signers[i].getBalance()
                      await charityContract.addRecipient(recipientAddress)
                      recipientBalancesBeforeDonation[i] = recipientBalance
                  }
              })

              it("receives all donations", async () => {
                  const balanceContract = await charityContract.provider.getBalance(
                      charityContract.address
                  )
                  assert.equal(balanceContract.toString(), totalEthDonated.toString())
              })

              let txResponse: ContractTransaction, txReceipt: ContractReceipt
              beforeEach(async () => {
                  txResponse = await charityContract.sendDonations()
                  txReceipt = await txResponse.wait(1)
              })
              it("triggers the donation event", async () => {
                  const donationEvent = txReceipt.events?.find(
                      (event) => event.event === "DonationsSent"
                  )
                  expect(donationEvent).to.not.be.undefined
              })

              it("sends the correct amount to all recipients", async () => {
                  const donationFeePercentage = await charityContract.getDonationFee()
                  const fee = totalEthDonated.mul(donationFeePercentage).div(100)
                  const amountPerRecipient = totalEthDonated.sub(fee).div(numberOfRecipients)

                  //   const totalFee = totalEthDonated.mul(donationFeePercentage).div(100)
                  //   const amountPerRecipient = totalEthDonated.sub(totalFee).div(numberOfDonors)

                  for (
                      let i = 2 + numberOfDonors;
                      i < 2 + numberOfDonors + numberOfRecipients;
                      i++
                  ) {
                      console.log(
                          `sending ${ethers.utils.formatEther(amountPerRecipient)} to ${
                              signers[i].address
                          }. prev balance: ${ethers.utils.formatEther(
                              recipientBalancesBeforeDonation[i]
                          )}`
                      )

                      const recipientBalance = await signers[i].getBalance()
                      const expectedBalance =
                          recipientBalancesBeforeDonation[i].add(amountPerRecipient)
                      console.log(
                          `expected balance: ${ethers.utils.formatEther(
                              expectedBalance
                          )}, actual balance: ${ethers.utils.formatEther(recipientBalance)}`
                      )

                      expect(recipientBalance.toString()).to.equal(expectedBalance)
                  }
              })
          })
      })
