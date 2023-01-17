class PortManager {
    // Dynamic port range
    startPortRange = 49152
    endPortRange = 65535
    ports = {}

    registerPort(port) {
        if(this.ports[port] === true) throw 'Port unavailable';
        this.ports[port] = true
    }

    getRandomPort() {
        let found = false;
        let candidate;

        do {
            candidate = Math.floor(Math.random() * (this.endPortRange - this.startPortRange) + this.startPortRange);
            if(this.ports[candidate] != true) found = true;
        } while(!found)

        return candidate;
    }
}


const manager = new PortManager()
module.exports = manager;