require('dotenv').config()
const morgan = require('morgan')
const axios = require('axios');
const express = require('express')
const pubsub = require('./helpers/pubsub')
const ForkManager = require('./helpers/ForkManager')
const {getLogs, logManager} = require('./helpers/logs')
const prepare = require(`./prepare_scripts/${process.env.PREPARE_SCRIPT}`)
const {resetFork, deploy} = require('./helpers/anvil')

// -------------------------
// ------ App Config -------
// -------------------------

const app = express()
app.use(morgan("tiny"))
app.use(express.json())
const port = process.env.SERVER_PORT || 420;
const forkMng = new ForkManager();
const PASSWORD = process.env.ACCESS_TOKEN


function simpleAuth(req, res, next) {
    console.log("checking")
    if(req.params.pass !== PASSWORD) {
        res.send("!auth");
    }
    next();
}

// -------------------------
// --------- Routes --------
// -------------------------

app.get('/', (req, res) => {
    res.send(`<pre>
    The best things in life are free.
    </pre>`);
})

app.get('/setup/:pass', simpleAuth, async (req, res) => {
    const port = forkMng.portManager.getRandomPort();

    pubsub.subscription(`Anvil_started:${port}`, () => deploy(port)).subscribe()
    pubsub.subscription(`Deployed_success:${port}`, () => prepare(port)).subscribe()

    const fork = await forkMng.start(port);
    
    pubsub.subscription(`Prepared:${port}`, () => {
        res.send(`It's over, Fork started with id: ${fork.id}, Contracts deployed and prepared! check <a href="/logs/${fork.id}/${req.params.pass}">Logs</a>`)
    }).subscribe()
})

app.get('/setup/:slug/:pass', simpleAuth, async (req, res) => {
    const slug = req.params.slug;
    if( forkMng.isIdAvailable(slug) ) {
        res.send("Vanity name not availale");
        return;
    }

    const port = forkMng.portManager.getRandomPort();

    pubsub.subscription(`Anvil_started:${port}`, () => deploy(port)).subscribe()
    pubsub.subscription(`Deployed_success:${port}`, () => prepare(port)).subscribe()

    const fork = await forkMng.start(port, req.params.slug);
    
    pubsub.subscription(`Prepared:${port}`, () => {
        res.send(`It's over, Fork started with id: ${fork.id}, Contracts deployed and prepared! check <a href="/logs/${fork.id}/${req.params.pass}">Logs</a>`)
    }).subscribe()
})

app.get('/alllogs', (req, res) => {
    res.send(`<pre>${getLogs()}</pre>`);
})

app.get('/ls', (req, res) => {
    res.send(`<pre>${forkMng.ls()}</pre>`);
})

app.get('/kill/:id/:pass', simpleAuth, async (req, res) => {
    forkMng.kill(req.params.id);
    res.send(`Fork ${req.params.id} killed!`)
})

app.get('/logs/:id/:pass', simpleAuth, (req, res) => {
    res.send(`<pre>${logManager.get(req.params.id)}</pre>`);
})

app.get('/newFork/:pass', simpleAuth, async (req, res) => {
    const port = forkMng.portManager.getRandomPort();
    const fork = await forkMng.start(port);
    res.send(`Fork started with id: ${fork.id}. Check <a href="/logs/${fork.id}">Logs</a>`)
})

app.get('/newFork/:slug/:pass', simpleAuth, async (req, res) => {
    const port = forkMng.portManager.getRandomPort();
    const fork = await forkMng.start(port, req.params.slug);
    res.send(fork.error ? fork.error : `Fork started with id: ${fork.id}. Check <a href="/logs/${fork.id}">Logs</a>`)
})

app.get('/reset/:slug/:pass', simpleAuth, async (req, res) => {
    await resetFork(forkMng.getPortById(req.params.slug))
    res.send(`Done, Check <a href="/logs/${res.params.slug}">Logs</a>`);
})

app.all("/rpc/:id/activate/:pass", simpleAuth, async (req, res, next) => {
    forkMng.activate(req.params.id);
    res.send(`RPC ${res.params.id} activated`);
})

app.all("/rpc/:id", async (req, res, next) => {
    try {
        const HOST = process.env.HOST || "188.166.45.35";
        if(!forkMng.isActive(req.params.id)) {
            res.send("!active");
            return;
        }
        const port = forkMng.getPortById(req.params.id);

    
        if (!port) {
            next(new Error("Node not found"));
            return;
        }
    
        console.log("node port");
        console.log(`http://${HOST}:${port}`);
        
        axios.post(`http://${HOST}:${port}`, req.body).then(function (response) {
            // handle success
            res.send(response.data)
        })
        .catch(function (error) {
            // handle error
            res.send(error);
        })
    } catch(e) {
        res.send(e);
    }
});

app.listen(port, () => {
    console.log(`Bestnet listening on port ${port}`)
})