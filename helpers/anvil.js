const util = require('util');
const { exec, spawn } = require('node:child_process');
const execProm = util.promisify(exec);
const pubsub = require('./pubsub')


const HOST = process.env.HOST || "127.0.0.1";
const REPO_PATH = process.env.REPO_PATH
const MAKE_CMD = process.env.MAKE_CMD || `make deploy-fork` 
const RPC = process.env.RPC;
const FORK_BLOCK = process.env.FORK_BLOCK || false;
const MNEMONIC = process.env.MNMONIC || false

let snapshot = "0x0";

async function startAnvil(
    port=PORT,
    forkBlock=FORK_BLOCK, 
    mnemonic=MNEMONIC,
    host=HOST
) {
    const params = [];

    if( forkBlock ) params.push('--fork-block-number', forkBlock);
    if( mnemonic ) params.push('-m', mnemonic);
    if( port ) params.push("-p", port.toString());
    if( host ) params.push("--host", host);
    params.push("-f", RPC);
    params.push("--steps-tracing");
    
    return spawn("anvil", params);
}

async function getSnapshot(port=PORT) {
    const rpc = `--rpc-url http://${HOST}:${port}`
    const cmd = exec(`cast rpc ${rpc} evm_snapshot`);

    cmd.stdout.on('data', function (data) {
        snapshot = data.toString();
        console.log('stdout: ' + data.toString());
        if(data.toString().includes("0x")) {
            pubsub.publish(`Prepared:${port}`);
        }
    });
    
    cmd.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
    });
    
    cmd.on('exit', function (code) {
        console.log('code ' + code.toString());
    });
}

async function killAnvil() {
    try{
        await execProm(`pkill anvil`);
    } catch(e) {}
}

async function resetFork(port=PORT) {
    const rpc = `--rpc-url http://${HOST}:${port}`
    console.log('snapshot old', snapshot)
    await execProm(`cast rpc ${rpc} evm_revert ${snapshot}`);
    getSnapshot()
}

async function deploy(port=PORT) {
    const rpc = `http://${HOST}:${port}`
    const cmd = exec(`cd ${REPO_PATH} && ${MAKE_CMD} RPC=${rpc}`);
    cmd.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        if(data.includes("ONCHAIN EXECUTION COMPLETE & SUCCESSFU")) {
            console.log("Deployed successfully")
            pubsub.publish(`Deployed_success:${port}`);
        }
    });
    
    cmd.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
    });
    
    cmd.on('exit', function (code) {
        console.log('code ' + code.toString());
    });
}

module.exports = {killAnvil, getSnapshot, startAnvil, resetFork, deploy}