/**
 * Jira Console
 * 
 * @author Mohammad Fares <faressoft.com@gmail.com>
 */

var request      = require('request'),
    is           = require('is_js'),
    q            = require('q'),
    inquirer     = require('inquirer'),
    lodash       = require('lodash'),
    moment       = require('moment'),
    async        = require('async'),
    glob         = require('glob'),
    clear        = require('clear'),
    chalk        = require('chalk'),
    yaml         = require('js-yaml'),
    ora          = require('ora'),
    fs           = require('fs-extra'),
    onChange     = require('on-change'),
    changeCase   = require('change-case'),
    Listr        = require('listr'),
    EventEmitter = require('events'),
    url          = require('url'),
    querystring  = require('querystring'),
    Flow         = require('step-flow'),
    fuzzy        = require('fuzzy');

var config       = require('./config'),
    data         = require('./data'),
    input        = require('./input',),
    tasks        = require('./tasks',),
    api          = require('./api'),
    jira         = require('./jira'),
    di           = require('./di');

var flow         = new Flow();

// Define the DI as a global object
global.di = di;

// Fix
EventEmitter.defaultMaxListeners = 0;

// Dependency Injection
di.set('request', request);
di.set('is', is);
di.set('q', q);
di.set('inquirer', inquirer);
di.set('moment', moment);
di.set('async', async);
di.set('glob', glob);
di.set('clear', clear);
di.set('lodash', lodash);
di.set('chalk', chalk);
di.set('yaml', yaml);
di.set('ora', ora);
di.set('fs', fs);
di.set('onChange', onChange);
di.set('changeCase', changeCase);
di.set('Listr', Listr);
di.set('url', url);
di.set('querystring', querystring);
di.set('Flow', Flow);
di.set('fuzzy', fuzzy);
di.set('config', config);
di.set('data', data);
di.set('input', input);
di.set('tasks', tasks);
di.set('api', api);
di.set('jira', jira);

// Loading
input.load();
tasks.load();

// Steps
flow.use('main', main);

// Flow
flow.use('selectProject', selectProject);
flow.use('selectTask', selectTask);
flow.use('continueConfirm', continueConfirm);

// Flow
flow.use('manageProjects', manageProjects);

// Flow
flow.use('configurations', configurations);

// Error handling
flow.catch(function(error) {
  console.error(chalk.red(error));
});

// The starting point
flow.run({});

/**
 * Main menu
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function main(context, next, jump) {

  var menu = [
    {title: 'Select Project', summary: 'Select from the already added projects', step: 'selectProject'},
    {title: 'Manage Projects', summary: 'Add and remove projects', step: 'manageProjects'},
    {title: 'Configurations and Preferences', summary: 'View and edit the configurations and preferencesstep', step: 'configurations'}
  ];

  input.selectItem(menu, 'Select', ['title'], ['summary']).then(function(item) {
    jump(item.step);
  });

}

/**
 * Select a project and store it as context.project
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function selectProject(context, next, jump) {

  input.selectItem(di.data.projects, 'Select a project', ['name'], ['key']).then(function(project) {

    // Add the selected project to the context object
    context.project = project;

    next();

  });

}

/**
 * Select a task to be performed on the project
 * and store it as context.task
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function selectTask(context, next, jump) {

  input.selectItem(tasks.getTasks(), 'Select a task', ['name'], ['summary']).then(function(task) {

    // Add the selected task to the context object
    context.task = task;

    // Execute the task
    task.run(context).then(function(result) {

      next();
      
    }).catch(function(error) {

      console.error(chalk.red(error));
      next();
      
    });
    
  });

}

/**
 * Prompt the user to confirm if he want to
 * continue using the app or to exit
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function continueConfirm(context, next, jump) {

  di.input.confirm('Do you want to continue').then(function(result) {

    if (!result) {
      return process.exit();
    }

    clear();
    jump('selectProject');

  });

}

/**
 * Load all projects to choose and add a new one
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function manageProjects(context, next, jump) {

  // Get a list of all projects and pick [id, key, name] keys
  var projects = di.api.get('/rest/api/2/project').then(function(projects) {

    return lodash.map(projects, function(project) {
      return lodash.pick(project, ['id', 'key', 'name'])
    });

  });

  // Prompt the user to add/remove projects
  input.selectItem(projects, 'Select a project', ['name'], ['key'], true, data.projects).then(function(projects) {

    // Update the saved projects
    data.projects = projects;

    jump('main');

  });

}

/**
 * Prompt the user to confirm if he want to
 * continue using the app or to exit
 * 
 * @param  {Object}   context
 * @param  {Function} next
 * @param  {Function} jump
 */
function configurations(context, next, jump) {

  di.input.edit('Configurations and Preferences', config.getContent()).then(function(content) {

    console.log(chalk.blue(yaml.dump(yaml.load(content))));
    jump('main');
    
  }).catch(next);

}
