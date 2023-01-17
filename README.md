![made-with-foundry](https://img.shields.io/badge/foundry-made%20with-orange)

<!-- LOGO -->
<h1>
<p align="center">
  <br>Bestnet
</h1>
  <p align="center">
The best network to develop solidity contract for EVM chains.
    <br />
    </p>
</p>
<p align="center">
  <a href="#about-the-project">About The Project</a> •
  <a href="#usage">How To Use</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#fork-snapshots">Fork Snapshots</a> •
  <a href="#upgrade-scripts">Upgrade scripts</a> •
  <a href="#contracts-deployment">Contracts deployment</a> •
</p>  

<p align="center">
  
![screenshot](img/clip.gif)
</p>                                                                                                                             
                                                                                                                                                      
## About The Project
Bestnet is a self-hosted simulated envirorment designed to test simple and complex smart contract scenarios on real-time, minimal-setup network that heavily relies on historical and up-to-date production data.


## Features

🍴 Create forks from any block in a breeze <br>
🤓 Human-readable RPC Urls<br>
🎚️ Turn ON/OFF your fork at anytime<br>
📝 Check your fork logs<br>
🎯 Automagically deploy contracts in the fork<br>
🥸 Automagically scripts which requires impersonating an account<br>
🔐 Simple authentifications<br>

## Install

The server used [Anvil](https://book.getfoundry.sh/reference/anvil/) from the foundry suite to create blazing-fast forks. 
[Learn how to install foundry](https://book.getfoundry.sh/getting-started/installation)

```bash
npm install
```

## Usage
```sh
node app.js

endpoints:
  /setup/:pass              Starts the fork, deploys the contract and execute the upgrade scripts if any
  /setup/:forkId/:pass      Starts the fork with a custom forkId, deploys the contract and execute the upgrade scripts (if any)
  /ls                       Get the list of all forks
  /logs/:forkId/:pass       Shows the logs from anvil
  /newFork/:pass            Only starts the fork
  /newFork/:forkId/:pass    Only starts the fork with custom id
  /reset/:forkId/:pass      Resets the fork to the last snapshot
  /kill/:forkId/:pass       Kill the anvil fork


RPC endpoints:
  /rpc/:id/on/:pass         Manually activate the fork
  /rpc/:id/off/:pass        Disable the fork, rpc request would not be processed
  /rpc/:id                  Regular RPC Endpoint, needs to be activated
```

## Configuration
You need to provide a valid `env` file to make it work.

```sh
HOST="127.0.0.1" # The host of the fork, use an ip if you want to expose this to the public
REPO_PATH="/MY/PATH" # Absolute path of the repo
MAKE_CMD="make deploy-fork" # Deploy script for the repo
RPC="https://eth-mainnet.g.alchemy.com/v2/APIKEY" # RPC to fork from
FORK_BLOCK=16076347 # Block to fork from, can remove this to fork from the latest block
MNMONIC="" # Mnemonic phrase to use, useful to have the same contract addresses
PREPARE_SCRIPT="myscript" # Name of the file containing the prepare script after deployment
SERVER_PORT=420 # Port the not server will run
ACCESS_TOKEN=test #Your secret access token
```

## Fork Snapshots
Bestnet provides snapshots to allow you to quickly go back at the state after deploying the contracts.
This is very useful to test things out while building a frontend for instance.
Bestnet only provides a snapshot at the time, a snapshot will be done automatically after the first deployment, just hit the `/reset` endpoint to go back in time to that moment.

## Upgrade scripts
Sometimes you need to simulate complex upgrade of a smartcontract system, Bestnet allows you to create a js script to prapare and simulate upgrades while simulating ownership of any account.
Just add the name of the script (without extension). If a `PREPARE_SCRIPT` variable name is not provided in the env it will simply skip it.

You can find an example [here](https://github.com/Alexintosh/Bestnet/blob/main/prepare_scripts/usdc_change_owner_vitalik.js).
The following script will:

- Change the ownership of the USDC contract to Vitalik
- Make Vitalik the pauser
- Pause USDC

```js
const util = require('util');
const { exec } = require('node:child_process');
const execProm = util.promisify(exec);
const {getSnapshot} = require('../helpers/anvil')

const HOST = process.env.HOST || "127.0.0.1";
const USDC_OWNER = "0xFcb19e6a322b27c06842A71e8c725399f049AE3a "
const USDC="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
const VITALIK="0xd8da6bf26964af9d7eed9e03e53415d37aa96045"

async function prepare(port) {
    const RPCFLAG = `--rpc-url http://${HOST}:${port}`
    await execProm(`cast rpc ${RPCFLAG} anvil_impersonateAccount ${USDC_OWNER}`);
    await execProm(`cast send ${USDC} --from ${USDC_OWNER} "transferOwnership(address)" ${VITALIK} ${RPCFLAG}`);
    await execProm(`cast rpc ${RPCFLAG} anvil_impersonateAccount ${VITALIK}`);
    await execProm(`cast send ${USDC} --from ${VITALIK} "updatePauser(address)" ${VITALIK} ${RPCFLAG}`);
    await execProm(`cast send ${USDC} --from ${VITALIK} "pause()" ${VITALIK} ${RPCFLAG}`);
    const { stdout, stderr } = await execProm(`cast call ${USDC} "paused()" ${RPCFLAG}`);
    getSnapshot(port)
}

module.exports = prepare
```

**📝 NOTE: Your script has to expose a function names `prepare`.**

## Contracts deployment
Bestnet is agnostic on how you develop and deploy your contract, it just need to know what script to run to deploy it.
Set the `MAKE_CMD` in your env to specify the script. An example is provided for your convienece inside [`contracts/script/`](https://github.com/Alexintosh/Bestnet/blob/main/contracts/script/Counter.s.sol) using foundry scripts.

In the example inside [`contracts/`](https://github.com/Alexintosh/Bestnet/blob/main/contracts/) we use a [Makefile](https://github.com/Alexintosh/Bestnet/blob/main/contracts/Makefile) thefore you should simply set in your env `MAKE_CMD="make deploy-fork"`.

Make sure you are exporting a `PRIVATE_KEY` inside the [`contracts/`](https://github.com/Alexintosh/Bestnet/blob/main/contracts/) folder.

## Considerations
We use this tool in the Auxo engineering team to better coordinate between frontend development and contract development.
You can host Bestnet on a vps or even locally by using a TCP tunnel like [bore](https://github.com/ekzhang/bore) to expose the RPC of the forked chain and Bestnet itself.

Lastly, this project has been quickly hacked together in a few hours so don't expect to be bullet-proof just yet. If you'd like to help or looking to help tweet at me at [@alexintosh](https://twitter.com/Alexintosh).

