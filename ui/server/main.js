
console.log("Starting server with Mongo URL: " + process.env.MONGO_URL);

function parseMongoUrl(url) {
  var m = url.match("^mongodb://([^:]+):([0-9]+)/(.*)$");
  if (!m) return {};
  return {
    host: m[1],
    port: parseInt(m[2]),
    db: m[3],
    url: url,
    shortUrl: url.substr("mongodb://".length)
  };
}

Meteor.publish('mongoUrl', function () {
  this.added('mongoUrl', '1', parseMongoUrl(process.env.MONGO_URL));
  this.ready();
});


// Apps page
Meteor.publish("apps", function() {
  return Applications.find();
});

Meteor.publish("app", function(appId) {
  return Applications.find({ id: appId });
});

Meteor.publish("latest-app", function() {
  return Applications.find({}, { sort: { _id: -1 }, limit: 1 });
});

lastApp = function() {
  return Applications.find({ id: { $exists: true } }, { sort: { _id: -1 }, limit: 1 });
};

// Jobs page
Meteor.publish("jobs-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  var jobs = Jobs.find({appId: appId}, { sort: { id: -1 } });
  var stageIDs = [];
  jobs.forEach(function(job) { stageIDs = stageIDs.concat(job.stageIDs); });
  return [
    jobs,
    Stages.find({ appId: appId, id: { $in: stageIDs }})
  ];
});


// Job page
Meteor.publish("job-page", function(appId, jobId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;

  var stages = Stages.find({ appId: appId, jobId: jobId }, { sort: { id: -1 }});
  var stageIDs = stages.map(function(stage) { return stage.id; });

  return [
    Jobs.find({appId: appId, id: jobId}),
    stages,
    StageAttempts.find({ appId: appId, stageId: { $in: stageIDs }})
  ];
});


// Stages page
Meteor.publish("stages-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    Stages.find({ appId: appId }),
    StageAttempts.find({ appId: appId })
  ]
});


// StageAttempt page
Meteor.publish("stage-page", function(appId, stageId, attemptId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    Stages.find({ appId: appId, id: stageId }),
    StageAttempts.find({ appId: appId, stageId: stageId, id: attemptId }),
    Tasks.find({ appId: appId, stageId: stageId }),
    TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }),
    Executors.find({ appId: appId })
  ];
});


// Storage page
Meteor.publish("rdds-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  var rdds = RDDs.find({
    appId: appId,
    $or: [
      { "storageLevel.UseDisk": true },
      { "storageLevel.UseMemory": true },
      { "storageLevel.UseExternalBlockStore": true },
      { "storageLevel.Deserialized": true },
      { "storageLevel.Replication": { $ne: 1} }
    ],
    unpersisted: { $ne: true }
  });
  return [
    rdds
  ];
});

Meteor.publish("rdd-page", function(appId, rddId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    RDDs.find({ appId: appId, id: rddId }),
    Executors.find({ appId: appId })
  ];
});

// Environment Page
Meteor.publish("environment-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return Environment.find({ appId: appId });
});

// Executors Page
Meteor.publish('executors-page', function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    apps,
    Executors.find({ appId: appId })
  ];
});
