/**
 * Data
 * To store and retrieve data
 * 
 * @author Mohammad Fares <mfares@souq.com>
 */

var fs       = require('fs')
  , onChange = require('on-change')
  , yaml     = require('js-yaml');

/**
 * The path of the data file
 * 
 * @type {String}
 */
var DATA_FILE_NAME = __dirname + '/data.yml';

/**
 * The content of the data file in YAML
 * @type {String}
 */
var dataContent = fs.readFileSync(DATA_FILE_NAME, 'utf8');

/**
 * To store the configurations
 * 
 * @type {Object}
 */
var data = yaml.load(dataContent);

/**
 * A deep proxy to trap the changes and save them
 */
module.exports = onChange(data, function() {

  process.nextTick(function() {
    
    // Save the data
    fs.writeFileSync(DATA_FILE_NAME, yaml.dump(data), 'utf8');

  });

});
