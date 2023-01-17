const { Console } = require('node:console') 
const { Transform } = require('node:stream') 
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

const PortManager = require('./PortManager')
const PubSub = require('./pubsub')
const {logManager} = require('./logs')
const {startAnvil} = require('./anvil')

const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
const logger = new Console({ stdout: ts })

function getTable (data) {
  logger.table(data)
  return (ts.read() || '').toString()
}

const guid = () => {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

class ForkManager {
    forks = {}
    portManager;

    constructor() {
        this.portManager = PortManager;
        // On process exit kill all node processes
        process.on("exit", () => this.nodes.forEach((node) => node.process.kill()));
    }

    isIdAvailable(slug) {
        return this.forks[slug] ? true : false;
    }

    getPortById(id) {
        if(this.forks[id]) return this.forks[id].port;
        throw "ID not valid";
    }

    isActive(id) {
        if(this.forks[id]) return this.forks[id].rpc_active;
        return false;
    }

    ls() {
        return getTable(this.forks).toString();
    }
 
    async start(port, slug=false, forkBlock, mnemonic) {
        this.portManager.registerPort(port);
        if(slug && this.forks[slug]) return { id: null, error: "Slug already in use"};

        const id = slug ? slug : guid();
        const childProcess = await startAnvil(port, forkBlock, mnemonic);
        
        this.forks[id] = {
            process: childProcess,
            rpc_active: false,
            port,
            id
        }

        console.log(id);

        childProcess.stdout.on('data', function (data) {
            data = decoder.write(data).trim();
            if(data.includes(`Listening on`)) {
                PubSub.publish(`Anvil_started:${port}`);
            }
        });

        childProcess.stdout.on('data', function (data) {
            data = decoder.write(data).trim();
            if(data === "eth_call") return;
            logManager.log(id, data);
        });
        
        childProcess.stderr.on('data', function (data) {
            data = decoder.write(data).trim();
            console.log('stderr: ' + data);
            logManager.log(id, data);
        });
        
        childProcess.on('exit', function (code) {
            logManager.log(id, 'Exited with code:' + code);
            console.log('Exited with code:' + code);
        });

        return {
            id,
            error: null
        };
    }

    activate(id) {
        if(this.forks[id]) {
            this.forks[id].rpc_active = true;
        }
    }

    kill(id) {
        if(this.forks[id]) {
            this.forks[id].process.kill();
            delete this.forks[id];
        }
    }
}

module.exports = ForkManager;