/**
 * Create Version
 * Create a new version
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * Get the name of the last added version
 * and store it as context.lastVersionName
 * store empty string if no versions yet
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function getLastVersion(context, next, jump) {

  di.jira.getVersions(context.project.id).then(function(versions) {

    if (versions.length) {
      context.lastVersionName = versions[0].name;
    } else {
      context.lastVersionName = '';
    }

    next();

  }).catch(next);

}

/**
 * Prompt the user to enter the name and the description
 * and store them as context.name and context.description
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function enterNameAndDescription(context, next, jump) {

  di.input.enterStrings(['name', 'description'], [context.lastVersionName]).then(function(answers) {

    // Required field
    if (!answers.name) {
      throw new Error('The name is a required field');
    }

    context.name = answers.name;
    context.description = answers.description;
    next();
    
  }).catch(function(error) {

    // Retry
    console.log(di.chalk.red(error));
    jump('enterNameAndDescription');
    
  });

}

/**
 * Prompt the user to enter the start date
 * and store it as context.startDate
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function enterStartDate(context, next, jump) {

  di.input.selectDate('Start Date').then(function(startDate) {

    context.startDate = startDate;
    next();
  
  }).catch(next);

}

/**
 * Prompt the user to enter the release date
 * and store it as context.releaseDate
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function enterReleaseDate(context, next, jump) {

  di.input.selectDate('Release Date').then(function(releaseDate) {

    context.releaseDate = releaseDate;
    next();
  
  }).catch(next);

}

/**
 * Create the version
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function createVersion(context, next, jump) {

  var data = {
    projectId: context.project.id,
    description: context.description,
    name: context.name,
    releaseDate: context.releaseDate,
    startDate: '2010-01-01'
  };

  // Execute the task
  di.api.post('/rest/api/2/version', data).then(next.bind(null, null)).catch(next);

}

/**
 * The starting point of the task
 *
 * @param  {Object}  context
 * @return {Promise} resolved when the task is finished
 */
function run(context) {

  return new Promise(function(resolve, reject) {

    var flow = new di.Flow();

    // Flow
    flow.use('getLastVersion', getLastVersion);
    flow.use('enterNameAndDescription', enterNameAndDescription);
    flow.use('enterStartDate', enterStartDate);
    flow.use('enterReleaseDate', enterReleaseDate);
    flow.use('createVersion', createVersion);

    // Done
    flow.use(resolve);

    // Error handling
    flow.catch(reject);

    // The starting point
    flow.run(context);

  });

}

////////////////////////////////////////////////////
// Module //////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = {
  name: 'Create Version',
  summary: 'Create a new version',
  run: run
};
