
const WebSocket = require('ws');
const request = require('request');
const chalk = require('chalk');

const auth = (user, pass, callback) => {
    console.log(chalk.magenta('[info]'), 'Logging into SmartThings API..');
    request.post('https://graph.api.smartthings.com/j_spring_security_check', {
        form: {
            j_username: user,
            j_password: pass,
            '_action_Log in': 'Log in'
        }
    }, (e, res) => {
        const headers = res.headers;
        /*
         * If the location header is the root of the domain, then the login as successful
         * It will be /login/auth?login_error=1 if the login failed.
         */
        if (res.headers.location && res.headers.location !== 'https://graph.api.smartthings.com/') {
            console.log(chalk.red('[ERROR]'), 'Log In failed, make sure your username/password is correct..');
            process.exit(1);
        }
        const cookies = headers['set-cookie'][0].split(';')[0];
        request.get('https://graph.api.smartthings.com/ide/logs', {
            headers: {
                cookie: cookies
            }
        }, (e, res, body) => {
            let server = null;
            body.split('\n').forEach((line) => {
                line = line.trim();
                /*
                 * This is so horribly wrong, but the only way to get the WSS server
                 * details is to parse the page and read them from the rendered HTML
                 * I really hate this :(
                 */
                if (line.indexOf('websocket: ') === 0) {
                    server = line.split("'")[1];
                }
                if (server && line.indexOf('client: ') === 0) {
                    server += 'client/' + line.split("'")[1];
                }
            });
            callback(null, server);
        });
    });
};

exports.auth = auth;


const colorLevel = (level) => {
    switch (level) {
        case 'INFO':
            return chalk.magenta(`[${level.toLowerCase()}] `);
        case 'DEBUG':
            return chalk.cyan(`[${level.toLowerCase()}]`);
        case 'TRACE':
            return chalk.red(`[${level.toLowerCase()}]`);
        case 'EVENT':
            return chalk.yellow(`[${level.toLowerCase()}]`);
    }
    return `[UNK]`;
};

const targets = {};

const patt = /[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i;

const dateRe  = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}-\d{4}/;

const hideGuid = (str) => {
    const matches = patt.exec(str);
    if (matches && matches[0]) {
        const word = matches[0];
        str = str.replace(word, word.split('-')[0] + '..');
        str = hideGuid(str);
    }
    const dMatches = dateRe.exec(str);
    if (dMatches && dMatches[0]) {
        const stamp = new Date(dMatches[0].replace(/: /g, ':'));
        str = str.replace(dMatches[0], stamp.toJSON());
        str = hideGuid(str);
    }
    return str;
};

const writeLine = (info, args) => {
    const lvl = info.level || 'EVENT';
    if (args.type.indexOf(lvl) === -1) {
        return null;
    }
    const level = colorLevel(lvl);
    const stamp = new Date(info.time || info.unixTime);
    let msg = info.description || info.msg || info.rawDescription;
    const titleTxt = info.linkText || targets[info.group];
    if (msg && titleTxt) {
        msg = msg.replace(titleTxt, '');
        msg = msg.trim();
    }
    msg = hideGuid(msg);
    const title = chalk.cyan(titleTxt);
    const time = chalk.magenta(`${stamp.toLocaleTimeString()}`);
    const line = `${level} ${time} ${title} - ${msg}`;
    if (!msg) {
        console.log(info);
    }
    console.log(line);
};

const writeLog = (json, args) => {
    if (Array.isArray(json.targets)) {
        json.targets.forEach((item) => {
            targets[item.id] = item.label;
        });
    }
    if (Array.isArray(json.logs)) {
        json.logs.forEach((log) => {
            writeLine(log, args);
        });
    }
    if (json.event) {
        writeLine(json.event, args);
    }
};


const logger = (url, args) => {
    console.log(chalk.magenta('[info]'), 'Logged In, waiting on events to start..');
    const socket = new WebSocket(url);
    const fn = function(line, bits) {
        let json = null;
        try {
            json = JSON.parse(line);
        } catch (e) {
        }
        if (json) {   
            writeLog(json, args);
        }
    };

    socket.on('open', fn);
    socket.on('message', fn);
};

exports.logger = logger;
