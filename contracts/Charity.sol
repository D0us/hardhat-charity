// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/*
Any address can donate
An admin can add a recepient
Send out the donations
    can trigger the event
    split amongst recipients
    donation fee sent to revenue wallet
*/

error Charity__NotOwner();
error Charity__NoRecipients();
error Charity__NoDonations();

contract Charity {
    address payable[] private s_recipients;
    // address payable[] private s_donors;
    uint256 private immutable i_donationFee;
    address private s_revenueAddress;
    address private immutable i_owner;
    address[] private s_donors;
    mapping(address => uint256) private s_donations;

    event DonationMade(address donor, uint256 amount);
    event DonationsSent(
        address payable[] recipients,
        uint256 totalDonated,
        uint256 donatedPerRecipient,
        uint256 fee
    );
    event RecipientAdded(address recipient);
    event RecipientRemoved(address recipient);
    event RevenueAddressChanged(address newRevenueAddress);

    constructor(uint256 donationFee, address revenueAddress) {
        i_owner = msg.sender;
        i_donationFee = donationFee;
        s_revenueAddress = revenueAddress;
    }

    /**
     * @dev A sender can donate eth
     */
    function donate() public payable {
        s_donors.push(msg.sender);
        s_donations[msg.sender] += msg.value;
        emit DonationMade(msg.sender, msg.value);
    }

    /**
     * @dev An admin can trigger the donation event
     * The total funding minus the fee is split evenly between the recipients
     * The fee is sent to the revenue address
     */
    function sendDonations() public payable onlyOwner {
        if (s_recipients.length > 0) revert Charity__NoRecipients();
        if (address(this).balance == 0) revert Charity__NoDonations();

        uint256 balance = address(this).balance;
        address payable[] memory recipients = s_recipients;

        uint256 fee = (balance * i_donationFee) / 100;
        uint256 totalDonatable = balance - fee;
        uint256 amountPerRecipient = totalDonatable / recipients.length;

        for (uint256 i = 0; i < recipients.length; i++) {
            recipients[i].transfer(amountPerRecipient);
        }
        // Collect the remainding fees
        payable(s_revenueAddress).transfer(fee);

        emit DonationsSent(recipients, totalDonatable, amountPerRecipient, fee);
    }

    /**
     * @dev An admin can add a recipient
     */
    function addRecipient(address payable recipient) public onlyOwner {
        s_recipients.push(recipient);
        emit RecipientAdded(recipient);
    }

    /**
     * @dev An admin can change the revenue address (for example if the old one is compromised)
     */
    function changeRevenueAddress(address newRevenueAddress) public onlyOwner {
        s_revenueAddress = newRevenueAddress;
        emit RevenueAddressChanged(newRevenueAddress);
    }

    /**
     * @dev An admin can remove a recepient (if they are no longer trusted as being legitimate)
     */
    function removeRecipient(address recipient) public onlyOwner {
        for (uint256 i = 0; i < s_recipients.length; i++) {
            if (s_recipients[i] == recipient) {
                s_recipients[i] = s_recipients[s_recipients.length - 1];
                s_recipients.pop();
                emit RecipientRemoved(recipient);
                break;
            }
        }
    }

    function getDonationFee() public view returns (uint256) {
        return i_donationFee;
    }

    function getDonation(address donor) public view returns (uint256) {
        return s_donations[donor];
    }

    function getDonators() public view returns (address[] memory) {
        return s_donors;
    }

    function getRecipients() public view returns (address payable[] memory) {
        return s_recipients;
    }

    function getRevenueAddress() public view returns (address) {
        return s_revenueAddress;
    }

    function balanceOf() public view returns (uint256) {
        return address(this).balance;
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert Charity__NotOwner();
        _;
    }
}
