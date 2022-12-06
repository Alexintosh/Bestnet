require('dotenv').config()
const express = require('express')
const util = require('util');
const { exec } = require('node:child_process');
const pubsub = require('./helpers/pubsub')
const {getLogs} = require('./helpers/logs')
const prepare = require(`./prepare_scripts/${process.env.PREPARE_SCRIPT}`)
const {killAnvil, startAnvil, resetFork, deploy} = require('./helpers/anvil')


// -------------------------
// ------ App Config -------
// -------------------------

const app = express()
const port = 420
const execProm = util.promisify(exec);
let initialised = false;

async function routine() {
    pubsub.subscription("Anvil_started", deploy).subscribe()
    pubsub.subscription("Deployed_success", prepare).subscribe()

    await killAnvil()
    await startAnvil();
}

// -------------------------
// --------- Routes --------
// -------------------------

app.get('/', (req, res) => {
    res.send(`<pre>
    Welcome traveler to Cheapderly!
    The homemade-rushed software for people dreaming of a free simulation api.

    Make sure to check logs /logs
    
    ---> /setup <--- This does everything, starts the fork, deploy the contract and execute the upgrade
    
    Other endpoints
    1. /startFork <-- Only starts anvil
    2. /deploy <-- Only deploys contracts
    3. /prepare <-- Only upgrades the old SharesTimelock to support migration
    3. /kill <-- Only kills Anvil
    </pre>`);
})

app.get('/kill', async (req, res) => {
    await killAnvil();
    res.send('Anvil killed!')
})

app.get('/setup', async (req, res) => {
    routine();
    pubsub.subscription("Prepared", () => {
        if(initialised === false) {
            res.send('It\'s over, Fork started, Contracts deployed and prepared! check /logs') 
            initialised = true
        }
            
    }).subscribe()
})

app.get('/logs', (req, res) => {
    res.send(`<pre>${getLogs()}</pre>`);
})

app.get('/prepare', async (req, res) => {
    await prepare();
    res.send('ok, check /logs')
})

app.get('/deploy', async (req, res) => {
    deploy();
    res.send('ok, check /logs and then call /prepare')
})

app.get('/startFork', async (req, res) => {
    await killAnvil()
    await startAnvil(res);
    res.send('ok, check /logs and then call /deploy')
})

app.get('/reset', async (req, res) => {
    await resetFork()
    res.send('Done, check /logs');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})