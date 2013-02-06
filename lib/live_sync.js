var fs = require("fs");
var watch = require("watch");
var Transport = require("./transport");
var path = require("path");

// read arguments from command line
// node lib/live_sync.js  path_to_folder host_name username password path_on_server
// 

if (process.argv.length < 7) {
  console.log("")
  console.log("USAGE:")
  console.log("live_sync <path_to_folder> <host_name> <username> <password> <path_on_server>")
  console.log("")
  process.exit()
}

var watchPath = process.argv[2];
var ftpHost   = process.argv[3];
var ftpUser   = process.argv[4];
var ftpPass   = process.argv[5];
var ftpPath   = process.argv[6];

// make sftp pointer global
sftp = null;

var transport = new Transport({
  type: 'sftp',
  host: ftpHost,
  port: 22,
  username: ftpUser,
  password: ftpPass,
  path : ftpPath
})

transport.on('ready', function() {

  console.log("watching " + watchPath);
  watch.watchTree(watchPath, function(filePath, curr, prev) {
    if (typeof filePath === "object" && prev === null && curr === null) {

    } else if (prev === null) {
      console.log("new file: " + filePath);
      return updateFile(filePath);
    } else if (curr.nlink === 0) {
      console.log("file deleted: " + filePath);
      return deleteFile(filePath);
    } else {
      console.log("file changed: " + filePath);
      return updateFile(filePath);
    }
  });

  var ignore = /^\.git/

  var updateFile = function(filePath) {
    var relativeFilePath = path.relative(watchPath, filePath)
    if(ignore.test(relativeFilePath)) {
      console.log("ignoring " + relativeFilePath)
      return
    }
    
    transport.updateFile( relativeFilePath, fs.readFileSync(filePath), function(err) {
      if (err) {
        console.log("writeFile ERROR");
        throw err;
      }
      return console.log("Done.");
    })
  };

  var deleteFile = function(filePath) {
    var relativeFilePath = path.relative(watchPath, filePath)
    if(ignore.test(relativeFilePath)) {
      console.log("ignoring " + relativeFilePath)
      return
    }

    transport.deleteFile(relativeFilePath, function(error) {
      if (error) {
        console.log("unlink ERROR: " + error);
        return;
      }
      return console.log("Done.");
    });
  };
})