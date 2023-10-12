const { ethers } = require('ethers');
const fs = require('fs');
const _ = require("lodash");

const sourceCsv = process.argv[2]
const targetCsv = process.argv[3]

if (process.argv.length !== 4) {
    console.error("Must specify 2 arguments <source.csv> and <target.csv>")
    process.exit(1)
}

if (!fs.existsSync(sourceCsv)) {
    console.error(`Source file does not exist: ${sourceCsv}`)
    process.exit(1)
}

if (fs.existsSync(targetCsv)) {
    console.error(`Target file already exists: ${sourceCsv}`)
    process.exit(1)
}

let distribution = [
    {
        tokenId: 1,
        amount: 817
    },
    {
        tokenId: 2,
        amount: 817
    },
    {
        tokenId: 3,
        amount: 817
    },
]

async function readCsv() {
    const fileContent = fs.readFileSync(sourceCsv).toString()
    const lines = fileContent.split('\n')
    const seenAddresses = new Set()
    const addresses = []
    let totalCount = 0
    for (let line of lines) {
        line = line.trim();
        if (!line) {
            console.warn("Empty line when parsing CSV, skipping...")
            continue
        }
        const [address,tokenId, amount] = line.split(',')
        const checksumAddress = ethers.getAddress(address);
        totalCount++;

        if (seenAddresses.has(checksumAddress))
            continue;

        seenAddresses.add(checksumAddress)
        addresses.push(address)
    }
    return addresses;
}

function getTotalDistribution() {
    let count = 0;
    for (const token of distribution)
        count += token.amount

    return count;
}

async function distribute() {
    const addresses = await readCsv()
    const totalDistributionCount = getTotalDistribution()
    if (addresses.length !== totalDistributionCount) {
        console.error(`Found ${addresses.length} addresses but total distribution count was ${totalDistributionCount}`)
        process.exit(1)
    }

    console.log(`Address and total distribution count match (${totalDistributionCount})!`)

    const shuffledAddresses = _.shuffle(addresses)
    const lines = []
    for (const addr of shuffledAddresses) {
        const tokenId = distribution[0].tokenId
        distribution[0].amount--
        if (distribution[0].amount === 0)
            distribution.shift()

        lines.push([addr, tokenId])
    }

    const shuffledLines = _.shuffle(lines)

    let csv = ''
    for (const line of shuffledLines) {
        csv += `${line[0]},${line[1]}\n`
    }

    fs.writeFileSync(targetCsv, csv)
}

distribute()