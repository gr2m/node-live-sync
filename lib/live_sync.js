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

  var ignore = /(\.git\b)/

  console.log("watching " + watchPath);
  watch.createMonitor(watchPath, {
    ignoreDotFiles: true
  }, function(monitor) {
    monitor.on('created', createFile);
    monitor.on('changed', updateFile);
    monitor.on('removed', deleteFile);
  });

  var createFile = function(filePath, stat) {
    var relativeFilePath = path.relative(watchPath, filePath)

    if ( stat.isDirectory() ) {
      transport.createDirectory( relativeFilePath, function(error) {
        if (error) {
          console.log("createDirectory ERROR ("+relativeFilePath+")");
          console.log(error);
          return
        }
      })
    } else {
      transport.createFile( relativeFilePath, fs.readFileSync(filePath), function(error) {
        if (error) {
          console.log("createFile ERROR ("+relativeFilePath+")");
        console.log(error);
        return
        }
      })
    }
    
    
  };

  var updateFile = function(filePath, curr, prev) {
    var relativeFilePath = path.relative(watchPath, filePath)

    transport.updateFile( relativeFilePath, fs.readFileSync(filePath), function(error) {
      if (error) {
        console.log("updateFile ERROR ("+relativeFilePath+")");
        console.log(error);
        return
      }
      return console.log("Done.");
    })
  };

  var deleteFile = function(filePath, stat) {
    var relativeFilePath = path.relative(watchPath, filePath)

    if ( stat.isDirectory() ) {
      transport.deleteDirectory(relativeFilePath, function(error) {
        if (error) {
          console.log("deleteDirectory ERROR ("+relativeFilePath+")");
          console.log(error);
          return
        }
      });
    } else {
      transport.deleteFile(relativeFilePath, function(error) {
        if (error) {
          console.log("deleteFile ERROR ("+relativeFilePath+")");
          console.log(error);
          return;
        }
      });
    }
  };
})