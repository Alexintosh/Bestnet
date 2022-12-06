const util = require('util');
const { exec } = require('node:child_process');
const execProm = util.promisify(exec);
const {getSnapshot} = require('../helpers/anvil')

const HOST = process.env.HOST || "127.0.0.1";
const USDC_OWNER = "0xFcb19e6a322b27c06842A71e8c725399f049AE3a "
const USDC="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
const VITALIK="0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
const RPCFLAG = `--rpc-url http://${HOST}:8545`


async function prepare() {
    await execProm(`cast rpc ${RPCFLAG} anvil_impersonateAccount ${USDC_OWNER}`);
    await execProm(`cast send ${USDC} --from ${USDC_OWNER} "transferOwnership(address)" ${VITALIK} ${RPCFLAG}`);
    await execProm(`cast rpc ${RPCFLAG} anvil_impersonateAccount ${VITALIK}`);
    await execProm(`cast send ${USDC} --from ${VITALIK} "updatePauser(address)" ${VITALIK} ${RPCFLAG}`);
    await execProm(`cast send ${USDC} --from ${VITALIK} "pause()" ${VITALIK} ${RPCFLAG}`);
    const { stdout, stderr } = await execProm(`cast call ${USDC} "paused()" ${RPCFLAG}`);
    getSnapshot()
}

module.exports = prepare