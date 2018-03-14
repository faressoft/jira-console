/**
 * Tasks
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * To store the tasks
 * @type {Array}
 */
var tasks = [];

/**
 * Load tasks
 */
function load() {

  var tasksScriptsPaths = di.glob.sync(__dirname + '/tasks/*.js');

  tasksScriptsPaths.forEach(function(taskScriptPath) {

    tasks.push(require(taskScriptPath));
    
  });

}

/**
 * Get a list of defined tasks
 * 
 * @return {Array} [{name, run}, ...]
 */
function getTasks() {

  return tasks;

}

////////////////////////////////////////////////////
// Module //////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = {
  getTasks: getTasks,
  load: load
};
