/**
 * Input
 * Provides UI prompts and utility functions
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * Check if a field is supported as an input
 * 
 * @param  {Object}  fieldEditMeta {name,operations,schema:{type,items,custom},allowedValues,autoCompleteUrl}
 *                                 - Optioanl keys are: allowedValues, autoCompleteUrl, schema.items, schema.custom.
 * @return {Boolean}
 */
function isSupportedField(fieldEditMeta) {

  return di.is.not.null(generateInputSchema(fieldEditMeta));

}

/**
 * Recognize the titlesKeys for an item
 * 
 * - Return the first avaliable key that is one of
 *   title, name, label, value, key, id, otherwise null
 * 
 * @param  {Object}      item
 * @return {String|Null}
 */
function recognizeTitleKey(item) {

  var candidateKeys = Object.keys(di.lodash.pick(item, ['title', 'name', 'label', 'value', 'key', 'id']));

  // No candidate for the summary key
  if (!candidateKeys.length) {
    return null;
  }

  return candidateKeys[0];

}

/**
 * Recognize the summaryKeys for an item
 * 
 * - Return the first avaliable key that is one of
 *   id, key, otherwise null
 * 
 * @param  {Object}      item
 * @return {String|Null}
 */
function recognizeSummaryKey(item) {

  var candidateKeys = Object.keys(di.lodash.pick(item, ['id', 'key']));

  // No candidate for the summary key
  if (!candidateKeys.length) {
    return null;
  }

  return candidateKeys[0];

}

/**
 * Analyse a filed and generate an input schema
 * or return null if we can't handle the field
 *
 * - Returns null if the passed fieldEditMeta
 *   is not an object.
 * 
 * @param  {Object}      fieldEditMeta {name,operations,schema:{type,items,custom},allowedValues,autoCompleteUrl}
 *                                     - Optioanl keys are: allowedValues, autoCompleteUrl, schema.items, schema.custom.
 * @return {Object|Null} {name,type,multiple,allowedValues,autoCompleteUrl}
 */
function generateInputSchema(fieldEditMeta) {

  // Not an object
  if (di.is.not.json(fieldEditMeta)) {
    return null;
  }

  // The types that we can handle
  var supportedTypes = ['number', 'string', 'datetime', 'date', 'user',
                        'priority', 'version', 'issuetype', 'resolution'];

  // To store the result
  var inputSchema = {
    name: fieldEditMeta.name,
    type: null,
    multiple: false,
    allowedValues: null,
    autoCompleteUrl: null
  };

  // No operations can be performed on this field
  if (di.is.not.propertyDefined(fieldEditMeta, 'operations') || di.is.empty(fieldEditMeta.operations)) {
    return null;
  }

  // Is an array field
  inputSchema.multiple = fieldEditMeta.schema.type == 'array';

  // The type of the field for single value fields
  // or the type of the items for multiple value fields
  inputSchema.type = inputSchema.multiple ? fieldEditMeta.schema.items : fieldEditMeta.schema.type;

  // Not a supported type
  if (di.is.not.inArray(inputSchema.type, supportedTypes)) {
    return null;
  }

  // Multiple value field with no provided allowedValues and autoCompleteUrl
  if (inputSchema.multiple && di.is.not.propertyDefined(fieldEditMeta, 'allowedValues') &&
                              di.is.not.propertyDefined(fieldEditMeta, 'autoCompleteUrl')) {
    return null;
  }

  // Not supported custom value field
  if (di.is.propertyDefined(fieldEditMeta.schema, 'custom') &&
      !fieldEditMeta.schema.custom.match(/^com\.atlassian\.jira/)) {
    return null;
  }

  // An allowedValues is provided
  if (di.is.propertyDefined(fieldEditMeta, 'allowedValues')) {
    inputSchema.allowedValues = fieldEditMeta.allowedValues;
  }

  // An autoCompleteUrl is provided
  if (di.is.propertyDefined(fieldEditMeta, 'autoCompleteUrl')) {
    inputSchema.autoCompleteUrl = fieldEditMeta.autoCompleteUrl;
  }

  return inputSchema;

}

/**
 * Generate a title by picking keys from an item
 *
 * - Pick the values from the item object of the specified keys
 * - Remove emprty and non-existy values
 * - Join by -
 * 
 * @param  {Array}           titleKeys an array of keys to pick from the item
 * @param  {Object}          item      optional
 * @return {Function|String} return a partial function that takes an item
 *                           if the item is not passed, otherwise
 *                           return the title
 */
function titleFormat(titleKeys, item) {

  var parialFunction = function(item) {

    var titleKeysValues = di.lodash.values(di.lodash.pick(item, titleKeys));

    // Remove emprty and non-existy values
    titleKeysValues = di.lodash.filter(titleKeysValues, di.lodash.overEvery([di.is.not.empty, di.is.existy]));

    // Join by -
    titleKeysValues = titleKeysValues.join(' - ');

    return titleKeysValues;

  };

  if (typeof item === 'undefined') {
    return parialFunction;
  }

  return parialFunction(item);

}

/**
 * Show a searchable list to the user to select single or multiple items
 * 
 * @param  {Array|Function|Promise} items        array of (objects|strings) or a function(input) that returns a promise
 * @param  {String}                 message      a hint message for the user about the list
 * @param  {Array|Function}         titleKeys    an array of keys to be concatendated by ' - ' as title (default: [])
 * @param  {Array|Function}         summaryKeys  an array of keys to be concatendated by ' - ' as summary (default: [])
 * @param  {Boolean}                multiple     multiple items can be selected if true (default: false)
 * @param  {Mixed}                  defaultValue an initially selected item (default: null)
 * @param  {Boolean}                allowEmpty   allow choosing no elements for (default: true)
 * @return {Promise} resolve with the selected project
 */
function selectItem(items, message, titleKeys, summaryKeys, multiple, defaultValue, allowEmpty) {

  // Inquirer prompt options
  var options = {
    name: 'item',
    message: message,
    pageSize: 10
  };

  // A function to get the items as promise
  var getItems = null;

  // A function to get the title keys
  var getTitleKeys = null;

  // A function to get the title keys
  var getSummaryKeys = null;

  // Default value for titleKeys
  if (typeof titleKeys === 'undefined') {
    titleKeys = [];
  }

  // Default value for summaryKeys
  if (typeof summaryKeys === 'undefined') {
    summaryKeys = [];
  }

  // Default value for multiple
  if (typeof multiple === 'undefined') {
    multiple = false;
  }

  // Default value for defaultValue
  if (typeof defaultValue === 'undefined') {
    defaultValue = null;
  }

  // Default value for allowEmpty
  if (typeof allowEmpty === 'undefined') {
    allowEmpty = true;
  }

  // The items passed as a function
  if (di.is.function(items)) {

    getItems = items;

  } else {

    getItems = function() {
      return Promise.resolve(items);
    };

  }

  // The titleKeys passed as a function
  if (di.is.function(titleKeys)) {

    getTitleKeys = titleKeys;

  } else {

    getTitleKeys = function() {
      return titleKeys;
    };

  }

  // The summaryKeys passed as a function
  if (di.is.function(summaryKeys)) {

    getSummaryKeys = summaryKeys;

  } else {

    getSummaryKeys = function() {
      return summaryKeys;
    };

  }

  // Multiple items value
  if (multiple) {

    defaultValue = JSON.parse(JSON.stringify(defaultValue));
    options.type = 'checkbox';
    options.searchable = true;
    options.highlight = true;
    options.default = defaultValue;

  // Single item value
  } else {

    options.type = 'autocomplete';

  }

  options.source = function(answersSoFar, input) {

    input = input || '';

    return getItems(input).then(function(items) {

      var titleKeys = getTitleKeys(items);
      var summaryKeys = getSummaryKeys(items);

      // Single value element with defaultValue that is not applied yet
      if (!multiple && defaultValue) {
        
        // Put the defaultValue at the top of the list
        items = items.sort(function(a, b) {
     
          if (di.lodash.isEqual(a, defaultValue)) {
            return -1;
          }
     
          if (di.lodash.isEqual(b, defaultValue)) {
            return 1;
          }
     
          return 0;
     
        });

        // Reset
        defaultValue = null;

      }

      var fuzzyResult = di.fuzzy.filter(input, items, {
        extract: titleFormat(titleKeys)
      });

      var data = fuzzyResult.map(function(item) {

        var itemTitle = titleFormat(titleKeys, item.original);

        // Summary key is specified
        if (di.is.not.empty(summaryKeys)) {
          itemTitle += ' ' + di.chalk.dim(titleFormat(summaryKeys, item.original));
        }

        return {
          name: itemTitle,
          value: item.original
        };

      });

      return data;

    });
      
  };

  return di.inquirer.prompt([options]).then(function(answers) {

    return answers.item;

  });

}

/**
 * Show a datepicker to the user to choose a date
 * 
 * @param  {String}  message      a hint message for the user
 * @param  {String}  defaultValue a date in the format YYYY-MM-DD (default: today's date)
 * @return {Promise} resolve with a date in the format YYYY-MM-DD
 */
function selectDate(message, defaultValue) {

  // Default value for defaultValue
  if (typeof defaultValue === 'undefined') {
    defaultValue = di.moment().format('YYYY-MM-DD');
  }

  return di.inquirer.prompt([{
    type: 'datetime',
    name: 'date',
    message: message,
    format: ['yyyy', '-', 'mm', '-', 'dd'],
    initial: di.moment(defaultValue, 'YYYY-MM-DD').toDate()
  }]).then(function(answers) {

    return di.moment(answers.date).format('YYYY-MM-DD');

  });

}

/**
 * Prompt the user to enter a string
 * 
 * @param  {String}  key          a hint key for the user
 * @param  {String}  defaultValue a default string (default: '')
 * @return {Promise} resolve with a string
 */
function enterString(key, defaultValue) {

  // Default value for defaultValue
  if (typeof defaultValue === 'undefined') {
    defaultValue = '';
  }

  return di.inquirer.prompt([{
    type: 'input',
    name: 'input',
    message: di.changeCase.titleCase(key),
    default: defaultValue
  }]).then(function(answers) {

    return answers.input;

  });

}

/**
 * Prompt the user to enter a primitive value
 * 
 * - the date and datetime returned as string
 * 
 * @param  {String}        key          a hint key for the user
 * @param  {String}        type         string, number, date, or datetime
 * @param  {String|Number} defaultValue a default value (default: '')
 * @return {Promise}       resolve with a string or number
 */
function enterPrimitiveValue(key, type, defaultValue) {

  var message = di.changeCase.titleCase(key);

  var options = {
    type: 'input',
    name: 'input',
    message: message
  };

  if (typeof defaultValue !== 'undefined') {
    options.default = defaultValue;
  }

  // Validate mumbers
  if (type == 'number') {

    // Add a validation option
    options.validate = function(value) {

      if (di.is.not.number(parseFloat(value))) {
        return 'The value must be a valid number';
      }

      return true;
      
    };

    // To convert the value into a number
    options.filter = parseFloat;

  }

  // For date and datetime types
  if (type == 'date' || type == 'datetime') {
    return selectDate(message, defaultValue);
  }

  // For string and number types
  return di.inquirer.prompt([options]).then(function(answers) {
    return answers.input;
  });

}

/**
 * Prompt the user to enter a list of strings
 * 
 * @param  {Array}   keys          array of keys (like: name, description)
 * @param  {Array}   defaultValues array of values (same order as keys)
 * @return {Promise} resolve with an object {key: value, ..}
 */
function enterStrings(keys, defaultValues) {

  // Default value for defaultValue
  if (typeof defaultValues === 'undefined') {
    defaultValues = [];
  }

  var prompts = [];

  // Foreach key
  keys.forEach(function(key, index) {

    prompts.push({
      type: 'input',
      name: key,
      message: di.changeCase.titleCase(key),
      default: defaultValues.length > index ? defaultValues[index] : null
    });
    
  });

  return di.inquirer.prompt(prompts).then(function(answers) {

    return answers;

  });

}

/**
 * Prompt the user to enter a Jira field
 * 
 * @param  {Object}                     fieldEditMeta {name,operations,schema:{type,items,custom},allowedValues,autoCompleteUrl}
 *                                                    - Optioanl keys are: allowedValues, autoCompleteUrl, schema.items, schema.custom.
 * @param  {Array|String|Number|Object} defaultValue  a default value (default: undefined)
 * @return {Promise}
 */
function enterField(fieldEditMeta, defaultValue) {

  var inputSchema = generateInputSchema(fieldEditMeta);

  // Promise for the value
  var value = Promise.resolve(null);

  // An allowedValues, an autoCompleteUrl is provided
  if (inputSchema.allowedValues || inputSchema.autoCompleteUrl) {

    // Dynamically recognize the title keys
    var titleKeys = function(items) {
      
      // No items
      if (!items.length) {
        return [];
      }

      return [recognizeTitleKey(items[0])];

    };

    // A list of items or a function that returns a promise provides items
    var source = null;

    // An allowedValues is provided
    if (inputSchema.allowedValues) {

      // No allowedValues items
      if (di.is.empty(inputSchema.allowedValues)) {
        return Promise.reject('No available values');
      }

      source = inputSchema.allowedValues;

    }

    // An autoCompleteUrl is provided
    if (inputSchema.autoCompleteUrl) {

      source = function(input) {

        var parsedUrl = di.url.parse(inputSchema.autoCompleteUrl + input, true);

        return di.api.get(parsedUrl.pathname, parsedUrl.query, false).then(function(result) {

          var items = [];

          // The response is an array
          if (di.is.array(result)) {
            items = result;
          }

          // The response is an object
          if (di.is.json(result)) {

            // Find the first array
            for (var key in result) {

              if (di.is.array(result[key])) {
                items = result[key];
                break;
              }

            }

          }

          // No search query is entered yet
          if (!input && defaultValue) {

            // The default value is an array of values
            if (di.is.array(defaultValue)) {
              items = items.concat(defaultValue);
            } else {
              items.push(defaultValue);
            }

            // Reset the default value
            defaultValue = null;

          }

          return items;

        });
        
      };

    }

    // Is a multiple values field
    if (inputSchema.multiple) {

      value = di.input.selectItem(source, inputSchema.name, titleKeys, [], true, defaultValue);

    // Is a single value field
    } else {

      value = di.input.selectItem(source, inputSchema.name, titleKeys, [], false, defaultValue);

    }

    // Format the value (when the type is a primitive and the selected values are objects)
    value = value.then(function(value) {

      var primitiveTypes = ['number', 'string', 'datetime', 'date'];

      // Not a primitive type
      if (di.is.not.inArray(inputSchema.type, primitiveTypes)) {
        return value;
      }

      /**
       * Get the first key's value casted to the primitive type
       * 
       * @param  {Object}         item
       * @return {String|Number}
       */
      var format = function(item) {

        // The item is not an object
        if (di.is.not.json(item)) {
          return item;
        }

        // The value of the first key
        var firstKeyValue = di.lodash.first(di.lodash.toArray(item));

        // The type is number
        if (inputSchema.type == 'number') {
          return parseFloat(firstKeyValue);
        }

        return firstKeyValue;

      };

      // Is a multiple values field
      if (inputSchema.multiple) {
        value = di.lodash.map(value, format);
      } else {
        value = format(value);
      }

      return value;

    });

  } else {

    value = di.input.enterPrimitiveValue(inputSchema.name, inputSchema.type, defaultValue);

  }

  return value;

}

/**
 * Prompt the user to confirm something
 * 
 * @param  {String}  message      a hint message for the user about the confirmation
 * @param  {Boolean} defaultValue a default value (default: true)
 * @return {Promise}
 */
function confirm(message, defaultValue) {

  // Default value for defaultValue
  if (typeof defaultValues === 'undefined') {
    defaultValues = true;
  }

  return di.inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: message,
    default: defaultValue
  }]).then(function(answers) {

    return answers.confirm;

  });

}

/**
 * Launches the user's preferred editor to edit a text
 * 
 * @param  {String}  message a hint message for the user about the content
 * @param  {String}  content a content to be edited (default: '')
 * @return {Promise}
 */
function edit(message, content) {

  // Default value for content
  if (typeof content === 'undefined') {
    content = '';
  }

  return di.inquirer.prompt([{
    type: 'editor',
    name: 'content',
    message: message,
    default: content
  }]).then(function(answers) {

    return answers.content;

  });

}

/**
 * Load plugins
 */
function load() {

  di.inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  di.inquirer.registerPrompt('checkbox', require('inquirer-checkbox-plus-prompt'));
  di.inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'));

}

////////////////////////////////////////////////////
// Module //////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = {
  isSupportedField: isSupportedField,
  generateInputSchema: generateInputSchema,
  selectItem: selectItem,
  selectDate: selectDate,
  enterPrimitiveValue: enterPrimitiveValue,
  enterString: enterString,
  enterStrings: enterStrings,
  enterField: enterField,
  confirm: confirm,
  edit: edit,
  load: load
};
