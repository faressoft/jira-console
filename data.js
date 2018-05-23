/**
 * Data
 * To store and retrieve data
 * 
 * @author Mohammad Fares <mfares@souq.com>
 */

var fs       = require('fs-extra')
  , onChange = require('on-change')
  , yaml     = require('js-yaml');

/**
 * The path of the data file
 * @type {String}
 */
var DATA_FILE_NAME = __dirname + '/data.yml';

/**
 * The path of the default data file
 * @type {String}
 */
var DEFAULT_DATA_FILE_NAME = __dirname + '/data.default.yml';

/**
 * The content of the data file in YAML
 * @type {String}
 */
var dataContent = null;

/**
 * To store the configurations
 * @type {Object}
 */
var data = null;

// The config file is not exist
if (!fs.existsSync(DATA_FILE_NAME)) {

  // Copy the default config file
  fs.copySync(DEFAULT_DATA_FILE_NAME, DATA_FILE_NAME);

}

// Read the data file
dataContent = fs.readFileSync(DATA_FILE_NAME, 'utf8');

// Parse the data file into an object
data = yaml.load(dataContent);

/**
 * A deep proxy to trap the changes and save them
 */
module.exports = onChange(data, function() {

  process.nextTick(function() {
    
    // Save the data
    fs.writeFileSync(DATA_FILE_NAME, yaml.dump(data), 'utf8');

  });

});
