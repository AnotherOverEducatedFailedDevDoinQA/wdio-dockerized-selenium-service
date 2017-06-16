import child_process from 'child_process';
import dateformat from 'dateformat';
import waitOn from 'wait-on';

// container name
const NAME = `sel-standalone-${dateformat('yymmddhhMMss')}`;
const DEFAULT_IMG = 'selenium/standalone-chrome:3.4.0';

class SeleniumLauncher {
    constructor () {
        this.enabled = undefined;
    }

    onPrepare (config) {
        const dockerizedSeleniumArgs = config.dockerizedSeleniumArgs || {};
        const imageName = dockerizedSeleniumArgs.imageName || DEFAULT_IMG;
        this.enabled = dockerizedSeleniumArgs.enabled === undefined ? true : dockerizedSeleniumArgs.enabled;

        if (!this.enabled) {
            return;
        }

        child_process.execSync(`docker run -d -p 0:4444 -p 0:5900 -v /dev/shm:/dev/shm --name ${NAME} ${imageName}`);
        try {
            // check if we are running in docker
            child_process.execSync(`awk -F/ '$2 == "docker"' /proc/self/cgroup | read`, {stdio: []});
            // we are running in docker
            config.host = child_process.execSync(
                `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${NAME}`).toString();
        } catch (err) {
            // we are not running in docker
            const port = child_process.execSync(
                `docker inspect -f '{{ (index (index .NetworkSettings.Ports "4444/tcp") 0).HostPort }}' ${NAME}`).toString();
            config.port = parseInt(port);
        }

        console.info(`Started dockerized selenium container ${NAME} at ${config.host}:${config.port}`)
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
        child_process.execSync(`docker rm -f ${NAME}`);
        console.log(`Removed docker container ${NAME}`);
    }
}

export default SeleniumLauncher;