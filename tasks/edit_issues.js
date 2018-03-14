/**
 * Edit Issues
 * Edit issues fields
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

/**
 * Get a list of all active issues and store them as context.issues
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function getActiveIssues(context, next, jump) {

  di.jira.getActiveIssues(context.project.id, context.project.type).then(function(issues) {

    context.issues = issues;
    next();

  }).catch(next);

}

/**
 * Select a list of fields and store them as context.selectedIssues
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function selectIssues(context, next, jump) {

  di.input.selectItem(context.issues, 'Select issues', ['summary'], ['key'], true, null, false).then(function(issues) {

    context.selectedIssues = issues;
    next();
  
  }).catch(next);

}

/**
 * Get the EditMeta for all issues
 * and store the response as context.selectedIssues[index].editMeta
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function getIssuesEditMeta(context, next, jump) {

  // To store the EditMeta requests
  var requests = [];

  // Foreach selected issue
  context.selectedIssues.forEach(function(issue) {

    // Add a request to load the EditMeta for the current issue
    requests.push({
      method: 'GET',
      endpoint: '/rest/api/2/issue/:issueIdOrKey/editmeta',
      params: {issueIdOrKey: issue.id}
    });
    
  });

  di.api.bulk(requests, true).then(function(results) {
  
    // Foreach response
    results.forEach(function(result, index) {

      // Store the EditMeta
      context.selectedIssues[index].editMeta = result;

    });

    next();
  
  }).catch(next);

}

/**
 * Get a unique list of the fields that included in
 * EditMeta for the selected issues, store them 
 * as an array context.fields [{id, name}]
 *
 * - Remove fields that are not supported
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function getIssuesFields(context, next, jump) {

  context.fields = [];

  // Foreach selected issue
  context.selectedIssues.forEach(function(issue) {

    di.lodash.forIn(issue.editMeta.fields, function(fieldEditMeta, fieldId) {

      // Is not supported field
      if (!di.input.isSupportedField(fieldEditMeta)) {
        return;
      }

      context.fields.push({
        id: fieldId,
        name: fieldEditMeta.name
      });

    });
    
  });

  // Remove duplicates
  context.fields = di.lodash.uniqWith(context.fields, di.lodash.isEqual);
  next();

}

/**
 * Select a list of fields and store them as context.selectedFields
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function selectFields(context, next, jump) {

  di.input.selectItem(context.fields, 'Select fields', ['name'], ['id'], true, null, false).then(function(fields) {

    context.selectedFields = fields;
    next();
  
  }).catch(next);

}

/**
 * Add an empty body property to all selected issues
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function addIssuesBody(context, next, jump) {

  // Foreach selected issue
  context.selectedIssues.forEach(function(issue) {

    issue.body = {};
    
  });

  next();

}

/**
 * Initialize the fields loop
 * 
 * - Set context.nextFieldIndex to 0
 * - Set context.currentField to null
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function fieldsLoopInit(context, next, jump) {

  context.nextFieldIndex = 0;
  context.currentField = null;
  next();

}


/**
 * Initialize the issues loop
 * 
 * - Set context.nextIssueIndex to 0
 * - Set context.currentIssue to null
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function issuesLoopInit(context, next, jump) {

  context.nextIssueIndex = 0;
  context.currentIssue = null;
  next();

}

/**
 * Pick the next field to work on
 * 
 * - Get context.nextFieldIndex.
 * - Increment context.nextFieldIndex.
 * - Set context.currentField if the index is in range,
 *   otherwise set to null.
 * - Delete context.lastValue
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function pickNextField(context, next, jump) {

  // Index is in range
  if (context.selectedFields.length >= context.nextFieldIndex) {
    context.currentField = context.selectedFields[context.nextFieldIndex];
  }

  delete context.lastValue;
  context.nextFieldIndex++;
  next();

}

/**
 * Pick the next issue to work on
 * 
 * - Get context.nextIssueIndex.
 * - Increment context.nextIssueIndex.
 * - Set context.currentIssue if the index is in range,
 *   otherwise set to null.
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function pickNextIssue(context, next, jump) {

  // Index is in range
  if (context.selectedIssues.length >= context.nextIssueIndex) {
    context.currentIssue = context.selectedIssues[context.nextIssueIndex];
  }

  context.nextIssueIndex++;
  next();

}

/**
 * Prompt the user to enter the value for the current filed
 * and store it as context.currentIssue.body
 * in the API's body format
 *
 * - Store the value as context.lastValue to be used as
 *   a default value for the next issues.
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function enterFieldValue(context, next, jump) {

  // No more fields or no more issues 
  if (!context.currentField || !context.currentIssue) {
    return next();
  }

  var fieldId = context.currentField.id;
  var fieldName = di.lodash.trim(context.currentField.name);
  var fieldEditMeta = context.currentIssue.editMeta.fields[fieldId];

  // The current field is not applicable for the current issue
  if (!fieldEditMeta || !di.input.isSupportedField(fieldEditMeta)) {

    console.log(di.chalk.red(`The field ${fieldName} is not supported or not available for the issue ` +
                             `${context.currentIssue.fields.summary} (${context.currentIssue.key})`));

    return next();

  }

  console.log(`Enter the field ${di.chalk.blue(fieldName)} for the issue ${di.chalk.blue(context.currentIssue.fields.summary)} (${context.currentIssue.key})`);

  if (fieldName == 'Assignee') {

    fieldEditMeta.allowedValues = [
      {id: 'admin', key: 'admin', name: 'Mohammad Fares'},
      {id: 'admin', key: 'admin', name: 'Josiah Gee'},
      {id: 'admin', key: 'admin', name: 'Terrance Eisen'},
      {id: 'admin', key: 'admin', name: 'Donn Mcgee'},
      {id: 'admin', key: 'admin', name: 'Timmy Purves'},
      {id: 'admin', key: 'admin', name: 'Leonel Schill'},
      {id: 'admin', key: 'admin', name: 'Jimmy Peeples'},
      {id: 'admin', key: 'admin', name: 'Shon Jiminez'},
      {id: 'admin', key: 'admin', name: 'Andreas Samayoa'},
      {id: 'admin', key: 'admin', name: 'Manual Ingersoll'},
      {id: 'admin', key: 'admin', name: 'Wilbur Kamerer'},
      {id: 'admin', key: 'admin', name: 'Leonardo Carasco'},
      {id: 'admin', key: 'admin', name: 'Ollie Dana'},
      {id: 'admin', key: 'admin', name: 'Nick Baird'},
      {id: 'admin', key: 'admin', name: 'Rubin Um'},
      {id: 'admin', key: 'admin', name: 'Herb Bohannan'},
      {id: 'admin', key: 'admin', name: 'Cleveland Bateman'},
      {id: 'admin', key: 'admin', name: 'Dexter Luckie'},
      {id: 'admin', key: 'admin', name: 'Alan Blohm'},
      {id: 'admin', key: 'admin', name: 'Travis Mccrimmon'},
      {id: 'admin', key: 'admin', name: 'Dorsey Mckeown'},
      {id: 'admin', key: 'admin', name: 'Stacy Mccorkle'},
      {id: 'admin', key: 'admin', name: 'Brandon Javier'},
      {id: 'admin', key: 'admin', name: 'Jamey Umland'},
      {id: 'admin', key: 'admin', name: 'Neal Paine'},
      {id: 'admin', key: 'admin', name: 'Evan Kirsch'},
      {id: 'admin', key: 'admin', name: 'Pete Mascio'},
      {id: 'admin', key: 'admin', name: 'Ramiro Blakeman'},
      {id: 'admin', key: 'admin', name: 'Mary Shatley'},
      {id: 'admin', key: 'admin', name: 'Wendell Agular'},
      {id: 'admin', key: 'admin', name: 'Joan Dellinger'},
      {id: 'admin', key: 'admin', name: 'Leroy Rayo'},
      {id: 'admin', key: 'admin', name: 'Danilo Pigman'},
      {id: 'admin', key: 'admin', name: 'Lacy Biello'},
      {id: 'admin', key: 'admin', name: 'Casey Marra'},
      {id: 'admin', key: 'admin', name: 'Porfirio Cady'},
      {id: 'admin', key: 'admin', name: 'Michal Neufeld'},
      {id: 'admin', key: 'admin', name: 'Giovanni Huston'},
      {id: 'admin', key: 'admin', name: 'Van Steigerwald'},
      {id: 'admin', key: 'admin', name: 'Barton Hovis'},
      {id: 'admin', key: 'admin', name: 'Christopher Pearson'},
      {id: 'admin', key: 'admin', name: 'Emery Benford'},
      {id: 'admin', key: 'admin', name: 'Abdul Chicoine'},
      {id: 'admin', key: 'admin', name: 'Adolfo Marte'},
      {id: 'admin', key: 'admin', name: 'Gerry Ide'},
      {id: 'admin', key: 'admin', name: 'Benjamin Halliwell'},
      {id: 'admin', key: 'admin', name: 'Myron Heitz'},
      {id: 'admin', key: 'admin', name: 'Hal Kowalewski'},
      {id: 'admin', key: 'admin', name: 'Leigh Vogan'},
      {id: 'admin', key: 'admin', name: 'Delmar Gilford'},
      {id: 'admin', key: 'admin', name: 'Brock Macky'},
    ];

    delete fieldEditMeta.autoCompleteUrl;

  }

  di.input.enterField(fieldEditMeta, context.lastValue).then(function(value) {

    if (fieldName == 'Assignee') {
      value = null;
    }

    context.lastValue = value;
    context.currentIssue.body[fieldId] = value;
    next();
  
  }).catch(next);

}

/**
 * End the issuesLoop if no more issues or continue
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function issuesLoopFlow(context, next, jump) {

  // No more issues
  if (!context.currentIssue) {
    return next();
  }

  jump('pickNextIssue');

}

/**
 * End the fieldsLoop if no more fields or continue
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function fieldsLoopFlow(context, next, jump) {

  // No more fields
  if (!context.currentField) {
    return next();
  }

  jump('pickNextField');

}

/**
 * Make the update requests
 * 
 * @param {Object}   context
 * @param {Function} next
 * @param {Function} jump
 */
function updateIssues(context, next, jump) {

  var tasks = new di.Listr([], {concurrent: true, exitOnError: false});

  // Foreach selected issue
  context.selectedIssues.forEach(function(issue) {

    var task = di.api.put.bind(null, '/rest/api/2/issue/:issueIdOrKey', {
      issueIdOrKey: issue.id,
      fields: issue.body
    }, false);

    // Add a new task
    tasks.add({
      title: 'Updating ' + issue.summary,
      task: task
    });
    
  });

  // Execute the tasks
  tasks.run().then(next.bind(null, null)).catch(next.bind(null, null));

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
    flow.use('getActiveIssues', getActiveIssues);
    flow.use('selectIssues', selectIssues);
    flow.use('getIssuesEditMeta', getIssuesEditMeta);
    flow.use('getIssuesFields', getIssuesFields);
    flow.use('selectFields', selectFields);
    flow.use('addIssuesBody', addIssuesBody);

    // Loop
    flow.use('fieldsLoopInit', fieldsLoopInit);
    flow.use('pickNextField', pickNextField);
    flow.use('issuesLoopInit', issuesLoopInit);
    flow.use('pickNextIssue', pickNextIssue);
    flow.use('enterFieldValue', enterFieldValue);
    flow.use('issuesLoopFlow', issuesLoopFlow);
    flow.use('fieldsLoopFlow', fieldsLoopFlow);

    // Flow
    flow.use('updateIssues', updateIssues);

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
  name: 'Edit Issues',
  summary: 'Edit issues fields',
  run: run
};
