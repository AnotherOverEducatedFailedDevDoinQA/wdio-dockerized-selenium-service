import child_process from 'child_process';
import dateformat from 'dateformat';
import waitOn from 'wait-on';

// container name
const NAME = `sel-standalone-${dateformat('yymmddhhMMss')}`;
const DEFAULT_IMG = 'selenium/standalone-chrome:3.4.0';

class SeleniumLauncher {
    constructor () {
        this.enabled = undefined;
        this.debug = undefined;
    }

    onPrepare (config) {
        const dockerizedSeleniumArgs = config.dockerizedSeleniumArgs || {};
        const imageName = dockerizedSeleniumArgs.imageName || DEFAULT_IMG;
        this.enabled = dockerizedSeleniumArgs.enabled === undefined ? true : dockerizedSeleniumArgs.enabled;
        this.debug = dockerizedSeleniumArgs.debug === undefined ? false : dockerizedSeleniumArgs.debug;

        if (!this.enabled) {
            return;
        }

        let out = child_process.execSync(`docker run -d -p 0:4444 -p 0:5900 -v /dev/shm:/dev/shm --name ${NAME} ${imageName}`);
        if (this.debug) {
            console.log(`Ran: docker run -d -p 0:4444 -p 0:5900 -v /dev/shm:/dev/shm --name ${NAME} ${imageName}`);
            console.log(out.toString());
        }
        try {
            // check if we are running in docker
            const opts = this.debug ? {} : {stdio: []};
            out = child_process.execSync(`grep -q docker /proc/1/cgroup`, opts);
            if (this.debug) {
                console.log(`Ran: awk -F/ '$2 == "docker"' /proc/self/cgroup | read`);
                console.log(out.toString())
            }
            // we are running in docker
            config.host = child_process.execSync(
                `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${NAME}`).toString().trim();
            if (this.debug) {
                console.log(`Set host to ${config.host}`)
            }
        } catch (err) {
            // we are not running in docker
            const port = child_process.execSync(
                `docker inspect -f '{{ (index (index .NetworkSettings.Ports "4444/tcp") 0).HostPort }}' ${NAME}`).toString();
            config.port = parseInt(port);
            if (this.debug) {
                console.log(`Set port to ${config.port}`)
            }
        }

        console.info(`Started dockerized selenium container ${NAME} at ${config.host}:${config.port}`);
        const statusUrl = `http-get://${config.host}:${config.port}/wd/hub/status`;
        const opts = {
            resources: [statusUrl],
            delay: 1000,
            timeout: 10000,
            followAllRedirects: true,
            followRedirect: true
        };
        return new Promise((resolve, reject) => waitOn(opts, (err) => {
            if (err) {
                console.error('Failed during wait for port');
                return reject(err)
            }

            resolve()
        }));
    }

    onComplete () {
        if (!this.enabled) {
            return;
        }
        const out = child_process.execSync(`docker rm -f ${NAME}`);
        if (this.debug) {
            console.log(`Ran: docker rm -f ${NAME}`)
            console.log(out.toString())
        }
        console.log(`Removed docker container ${NAME}`);
    }
}

export default SeleniumLauncher;