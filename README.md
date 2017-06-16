# wdio-dockerized-selenium-service

WebdriverIO service to start & stop a docker container running Selenium Standalone server

This is particularly useful for setting up simple CI without needing to run tests against
SauceLabs or a self maintained Selenium grid. It assumes that you have docker setup on the machine.

## Setup 


...is quite simple. Install using 

```npm i --save wdio-dockerized-selenium-service```

and then update `wdio.conf.js` with

```$js
services: ['dockerized-selenium'],
```

## Configuration options


You can additionally update `wdio.conf.js` with following options:

```js
dockerizedSeleniumArgs: {
    imageName: <string>,
    enabled: <boolean>
}
```

### imageName 
Name of the image. You can see the complete list at [https://github.com/SeleniumHQ/docker-selenium](https://github.com/SeleniumHQ/docker-selenium).

Default: `selenium/standalone-chrome:3.4.0`

### enabled
Whether this service should be used or not. It's useful at times to disable it when running locally, or only
enable it when running it as part of ci. 

Default: `true`

#### Example
Personally I have used `yargs` package and setup a flag to enable it only when needed. Update `wdio.conf.js` with

```
dockerizedSeleniumArgs: {
    enabled: require('yargs').argv.useDockerizedSelenium || false
}
```

and then specify `--use-dockerized-selenium` as a commmand line argument when running tests.

## Tests In/Out of docker

The service setup works even when the test are themselves run inside a docker container. The only requirement then
is to make sure the docker container has a docker client and docker socket volume mounted.

-----

The code in this repo is based off of the existing work done for 
[wdio-selenium-standalone-service](https://github.com/webdriverio/wdio-selenium-standalone-service) and 
[wdio-sauce-service](https://github.com/webdriverio/wdio-sauce-service)