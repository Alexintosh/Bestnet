const util = require('util');
const { exec } = require('node:child_process');
const {log} = require('./logs')
const execProm = util.promisify(exec);
const pubsub = require('./pubsub')


const HOST = process.env.HOST || "127.0.0.1";
const RPCFLAG = `--rpc-url http://${HOST}:8545`
const REPO_PATH = process.env.REPO_PATH
const MAKE_CMD = process.env.MAKE_CMD || `make deploy-fork` 
const RPC = process.env.RPC;
const FORK_BLOCK = process.env.FORK_BLOCK || false;
const MNEMONIC = process.env.MNMONIC || false

let snapshot = "0x0";

async function startAnvil(res) {
    const anvilstart = exec(`anvil --host ${HOST} -f ${RPC} ${FORK_BLOCK ? `--fork-block-number ${FORK_BLOCK}` : ''} ${MNEMONIC ? `-m "${MNEMONIC}"` : '' }`);
    
    anvilstart.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        if(data === "eth_call") return;
        log(data);
        if(data.includes(`Listening on ${HOST}:8545`)) {
            console.log("Anvil started")
            pubsub.publish("Anvil_started");
        }
    });
    
    anvilstart.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        log(data);
    });
    
    anvilstart.on('exit', function (code) {
        log('Exited with code:' + code);
        console.log('Exited with code:' + code);
    });
}

async function getSnapshot() {
    const cmd = exec(`cast rpc ${RPCFLAG} evm_snapshot`);
    cmd.stdout.on('data', function (data) {
        snapshot = data.toString();
        log('SNAPSHOT ID: ' + data.toString())
        console.log('stdout: ' + data.toString());
        if(data.toString().includes("0x")) {
            pubsub.publish("Prepared");
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

async function resetFork() {
    console.log('snapshot old', snapshot)
    await execProm(`cast rpc evm_revert ${snapshot}`);
    getSnapshot()
}

async function deploy() {
    const cmd = exec(`cd ${REPO_PATH} && ${MAKE_CMD}`);
    cmd.stdout.on('data', function (data) {
        console.log('stdout: ' + data.toString());
        log(data);
        if(data.includes("ONCHAIN EXECUTION COMPLETE & SUCCESSFU")) {
            console.log("Deployed successfully")
            pubsub.publish("Deployed_success");
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