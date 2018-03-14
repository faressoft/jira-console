/**
 * API Helper
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * Make an API call
 * 
 * @param  {String}  method      GET, POST, PUT, DELETE
 * @param  {String}  endpoint
 * @param  {Object}  params      query or body params (default: {})
 * @param  {Boolean} showSpinner show the loading spinner (default: true)
 * @return {Promise} reject when the request is failed or has errors
 */
function call(method, endpoint, params, showSpinner) {

  endpoint = pathReplace(endpoint, params);

  // Default value for showSpinner
  if (typeof showSpinner === 'undefined') {
    showSpinner = true;
  }

  // Default value for params
  if (typeof params === 'undefined') {
    params = {};
  }

  return new Promise(function(resolve, reject) {

    var url = di.config.getBaseURL() + endpoint + '?' + di.querystring.encode(params);

    var options = {
      method: method,
      url: url,
      headers: {
        'Authorization': 'Basic ' + di.config.getAuthString(),
        'Content-Type': 'application/json'
      },
      body: params,
      json: true
    };

    // Show a loading spinner
    if (showSpinner) {

      var spinner = di.ora({
        text: 'loading',
        color: 'yellow'
      }).start();

    }

    // Make the request
    di.request(options, function (error, response, body) {

      // Stop the loading spinner
      if (showSpinner) {
        spinner.stop();
      }

      if (error) {
        return reject(error);
      }

      // Failed
      if (!(200 <= response.statusCode && response.statusCode < 300)) {

        if (di.is.json(body)) {

          var errorMessage = '';

          // Invalid input
          if (di.is.propertyDefined(body, 'errors') && di.is.not.empty(body.errors)) {

            var errors = di.lodash.map(body.errors, function(value, key) {
              return key + ': ' + value;
            });

            errorMessage = errors.join('\n');

          }

          // Other errors
          if (di.is.propertyDefined(body, 'errorMessages') && di.is.not.empty(body.errorMessages)) {
            errorMessage = body.errorMessages.join();
          }

          return reject(new Error(errorMessage));

        }

        return reject(new Error('The request is failed with: ' + response.statusCode));

      }

      resolve(body);

    });

  });

}

/**
 * To replace url's placeholders with their values,
 * and delete the replaced parameters from the passed object
 * 
 * @param  {String} endpoint
 * @param  {Object} params
 * @return {String}
 */
function pathReplace(endpoint, params) {

  for (var i in params) {

    var value = params[i];
    var pattern = null;

    // Param at the middle
    pattern = new RegExp('/:' + i + '/');

    if (pattern.test(endpoint)) {
      endpoint = endpoint.replace(pattern, '/' + value + '/');
      delete params[i];
    }

    // Param at the end
    pattern = new RegExp('/:' + i + '$');

    if (pattern.test(endpoint)) {
      endpoint = endpoint.replace(pattern, '/' + value);
      delete params[i];
    }

  }

  return endpoint;

}

/**
 * An alias for call('GET', endpoint, params)
 * 
 * @param  {String}  endpoint
 * @param  {Object}  params
 * @param  {Boolean} showSpinner show the loading spinner (default: true)
 * @return {Promise} reject when the request is failed or has errors
 */
module.exports.get = module.exports.GET = function(endpoint, params, showSpinner) {
  return call('GET', endpoint, params, showSpinner);
};

/**
 * An alias for call('POST', endpoint, params)
 * 
 * @param  {String}  endpoint
 * @param  {Object}  params
 * @param  {Boolean} showSpinner show the loading spinner (default: true)
 * @return {Promise} reject when the request is failed or has errors
 */
module.exports.post = module.exports.POST = function(endpoint, params, showSpinner) {
  return call('POST', endpoint, params, showSpinner);
};

/**
 * An alias for call('PUT', endpoint, params)
 * 
 * @param  {String}  endpoint
 * @param  {Object}  params
 * @param  {Boolean} showSpinner show the loading spinner (default: true)
 * @return {Promise} reject when the request is failed or has errors
 */
module.exports.put = module.exports.PUT = function(endpoint, params, showSpinner) {
  return call('PUT', endpoint, params, showSpinner);
};

/**
 * An alias for call('DELETE', endpoint, params)
 * 
 * @param  {String}  endpoint
 * @param  {Object}  params
 * @param  {Boolean} showSpinner show the loading spinner (default: true)
 * @return {Promise} reject when the request is failed or has errors
 */
module.exports.delete = module.exports.DELETE = function(endpoint, params, showSpinner) {
  return call('DELETE', endpoint, params, showSpinner);
};

/**
 * Make bulk requests
 * 
 * @param  {Object|Array} requests    {key: {method, endpoint, params}, ..} or
 *                                    [{method, endpoint, params}, ...]
 * @param  {Boolean}      showSpinner show the loading spinner (default: true)
 * @return {Promise}
 */
module.exports.bulk = function(requests) {

  return new Promise(function(resolve, reject) {

    // Default value for showSpinner
    if (typeof showSpinner === 'undefined') {
      showSpinner = true;
    }

    // Show a loading spinner
    if (showSpinner) {

      var spinner = di.ora({
        text: 'loading',
        color: 'yellow'
      }).start();

    }

    /**
     * To be called when the requests are finished
     * 
     * @param  {Object|Null}  error
     * @param  {Array|Object} results
     */
    var doneCallback = function(error, results) {

      // Stop the loading spinner
      if (showSpinner) {
        spinner.stop();
      }

      if (error) {
        return reject(error);
      }

      resolve(results);

    };

    /**
     * Execute a request
     * 
     * @param  {Object}   request
     * @param  {Function} callback
     */
    var execute = function(request, callback) {

      var args = [null, request.method, request.endpoint, request.params, false];

      var task = di.async.asyncify(call.bind(null,
                                             request.method, 
                                             request.endpoint,
                                             request.params,
                                             false));
      task(callback);
    
      
    };

    // The requests are passed as an array
    if (di.is.array(requests)) {

      di.async.map(requests, execute, doneCallback);

    // The requests are passed as an object
    } else {

      di.async.mapValues(requests, di.lodash.rearg(execute, [0, 2, 1]), doneCallback);

    }
    
  });

};
