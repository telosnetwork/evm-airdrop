const { ethers } = require('ethers');
const fs = require('fs');

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
    console.error(`Target file already exists: ${targetCsv}`)
    process.exit(1)
}

async function readCsv() {
    const fileContent = fs.readFileSync(sourceCsv).toString()
    const lines = fileContent.split('\n');
    const seenAddresses = new Set()
    const addresses = []
    let totalCount = 0;
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
    console.log(`Unique count: ${addresses.length}`)
    console.log(`Total count: ${totalCount}`)
    return addresses;
}

async function deduplicate() {
    const addresses = await readCsv();
    fs.writeFileSync(targetCsv, addresses.join('\n'))
}

deduplicate()