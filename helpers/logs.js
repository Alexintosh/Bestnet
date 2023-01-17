class LogManager {
    logs = {}

    log(id, log) {
        if(log)
            this.logs[id] = `${this.logs[id]} \n ${log.toString()}`;
    }

    get(id) {
        return this.logs[id];
    }
}

const logManager = new LogManager();

module.exports = {logManager}