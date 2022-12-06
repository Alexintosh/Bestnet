let logs = `Fresh start`;

function log(l='') {
    if(l)
    logs = `${logs} \n ${l.toString()}`;
}

function getLogs(l='') {
    return logs;
}

module.exports = {getLogs, log}
