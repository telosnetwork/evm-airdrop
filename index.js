const { ethers } = require('ethers');
const fs = require('fs');
const CONTRACT_ABI = require('./1155')
require('dotenv').config()

const ENDPOINT = process.env.ENDPOINT
const CSV_FILE = process.env.CSV_FILE
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const SENDER_KEY = process.env.SENDER_PRIVATE_KEY
const GAS_AMOUNT = ethers.parseEther(process.env.GAS_AMOUNT)


const provider = new ethers.getDefaultProvider(ENDPOINT);
const wallet = new ethers.Wallet(SENDER_KEY, provider);

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

async function readCsv() {
    const fileContent = fs.readFileSync(CSV_FILE).toString()
    const lines = fileContent.split('\n');
    const seenAddresses = new Set()
    const addresses = []
    for (let line of lines) {
        line = line.trim();
        if (!line) {
            console.warn("Empty line when parsing CSV, skipping...")
            continue
        }
        const [address,tokenId, amount] = line.split(',')
        if (seenAddresses.has(address))
            throw new Error(`Already seen ${address}, CSV must contain unique addresses.  If you want to sent multiple tokens then modify the script`)

        const checksumAddress = ethers.getAddress(address);
        seenAddresses.add(checksumAddress)
        addresses.push({
            address,
            tokenId,
            amount: parseInt(amount ? amount : '1')
        })
    }
    return addresses;
}

async function airdropTokens() {
    const addresses = await readCsv();
    for (let {address, tokenId, amount} of addresses) {
        console.log(address + " -- " + tokenId + " -- " + amount)
        const tokenIds = [tokenId]
        const amounts = [amount]
        try {
            if (GAS_AMOUNT > 0) {
                const gasTx = await wallet.sendTransaction({
                    to: address,
                    value: GAS_AMOUNT
                }, {
                    gasLimit: 21000
                })
                await gasTx.wait()
            }
            const tx = await contract.safeBatchTransferFrom(wallet.address, address, tokenIds, amounts, '0x00', {
                gasLimit: 80000
            });
            console.log(`Sent airdrop to ${address}. Transaction Hash: ${tx.hash}`);
            await tx.wait();  // Wait for transaction to be mined
        } catch (error) {
            console.error(`Error sending to ${address}: `, error);
        }
    }
}

airdropTokens()