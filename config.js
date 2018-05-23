/**
 * Config
 * A wrapper for the configurations
 * 
 * @author Mohammad Fares <mfares@souq.com>
 */

var fs   = require('fs-extra')
  , yaml = require('js-yaml');

/**
 * The path of the config file
 * @type {String}
 */
var CONFIG_FILE_NAME = __dirname + '/config.yml';

/**
 * The path of the default config file
 * @type {String}
 */
var DEFAULT_CONFIG_FILE_NAME = __dirname + '/config.default.yml';

/**
 * The content of the config file in YAML
 * @type {String}
 */
var configContent = null;

/**
 * To store the configurations
 * @type {Object}
 */
var config = null;

// The config file is not exist
if (!fs.existsSync(CONFIG_FILE_NAME)) {

  // Copy the default config file
  fs.copySync(DEFAULT_CONFIG_FILE_NAME, CONFIG_FILE_NAME);

}

// Read the config file
configContent = fs.readFileSync(CONFIG_FILE_NAME, 'utf8');

// Parse the config file into an object
config = yaml.load(configContent);

/**
 * Get username and password formatted Basic Auth
 *
 * @return {String} base64(username:password)
 */
module.exports.getAuthString = function() {
  return new Buffer(config.account.username + ':' + config.account.password).toString('base64');
};

/**
 * Get all the added project
 * 
 * @return {Array}
 */
module.exports.getProjects = function() {
  return config.projects;
};

/**
 * Get server's base url
 * 
 * @return {Object}
 */
module.exports.getBaseURL = function() {
  return config.account.base_url;
};

/**
 * Get the the config file's content
 * 
 * @return {Object}
 */
module.exports.getContent = function() {
  return configContent;
};

