/**
 * Jira
 * To define reusable methods to call the most used apis
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * Get a list of avaliable projects
 * 
 * @return {Promise} resolve with [{id,key,name,type}, ..]
 */
function getProjects() {

  return di.api.get('/rest/api/2/project').then(function(result) {

    // The keys that we want to include
    var keys = ['id', 'key', 'name'];

    // Format the result
    result = di.lodash.map(result, function(record) {

      // Pick keys
      record = di.lodash.pick(record, keys);

      record.type = 'scrum';

      return record;

    });

    return result;

  });

};

/**
 * Get a list of avaliable versions
 * 
 * @param  {String}  projectIdOrKey
 * @return {Promise} resolve with [{id,description,name,archived,released}, ..]
 */
function getVersions(projectIdOrKey) {

  return di.api.get('/rest/api/2/project/:projectIdOrKey/versions', {
    projectIdOrKey: projectIdOrKey
  }).then(function(result) {

    // The keys that we want to include
    var keys = ['id', 'description', 'name', 'archived', 'released'];

    // Format the result
    result = di.lodash.map(result, function(record) {

      // Set the empty keys to null
      record = di.lodash.defaults(record, {'description': null});

      // Pick keys
      record = di.lodash.pick(record, keys);

      return record;

    });

    // Reverse
    result = di.lodash.reverse(result);

    return result;

  });

};

/**
 * Get a list of all active issues
 *
 * - scrum: get the issues of the current sprint.
 * - kanban: get all issues.
 * 
 * @param  {String}  projectIdOrKey
 * @param  {String}  type           scrum, kanban
 * @return {Promise}
 */
function getActiveIssues(projectIdOrKey, type) {

  // Sprints based project
  if (type == 'scrum') {
    var query = `project = ${projectIdOrKey} AND sprint in openSprints()`;
  } else {
    var query = `project = ${projectIdOrKey}`;
  }

  return di.api.get('/rest/api/2/search', {
    jql: query,
    fields: 'project,summary,description,status'
  }).then(function(result) {

    // Format the result
    result.issues = di.lodash.map(result.issues, function(object) {

      // Add the summary
      object.summary = object.fields.summary;

      return object;

    });

    return result.issues;
  
  })

};

////////////////////////////////////////////////////
// Module //////////////////////////////////////////
////////////////////////////////////////////////////

module.exports = {
  getProjects: getProjects,
  getVersions: getVersions,
  getActiveIssues: getActiveIssues
};
