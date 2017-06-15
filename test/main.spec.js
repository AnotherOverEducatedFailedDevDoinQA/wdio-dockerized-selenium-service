const assert = require('assert');

describe('webdriverio', function () {
    it('should run a test', function () {
        browser.url('/')
        assert.equal(browser.getTitle(), 'WebdriverIO - WebDriver bindings for Node.js')
    })
});