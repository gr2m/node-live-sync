var path         = require("path");
var Connection   = require('ssh2');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

var Transport = function( config ) {
  this.config = config;

  this.initConnection()
}
util.inherits(Transport, EventEmitter);

Transport.prototype.initConnection = function() {
  this.connection = new Connection();

  this.connection.on("error", function() {
    console.log("FTP error", arguments);
  });
  this.connection.on("timeout", function() {
    console.log(arguments);
  });
  this.connection.on("close", function() {
    console.log("Closed.");
  });
  this.connection.on("end", function() {
    console.log("FTP connection closed.");
  });
  this.connection.on("ready", function() {
    console.log("FTP connection ready.");
    return this.connection.sftp(function(err, sftpClient) {
      if (err) {
        console.log("SFTP ERR");
        throw err;
      }
      this.sftp = sftpClient;
      this.emit('ready');
      console.log("sftp is ready to go!");
    }.bind(this));
  }.bind(this));

  console.log("Connecting to " + this.config.username + ":" + this.config.password + "@" + this.config.host + ":22");
  this.connection.connect({
    host: this.config.host,
    port: 22,
    username: this.config.username,
    password: this.config.password
  });
};

Transport.prototype.createFile = function(relativeFilePath, data, callback) {
  this.updateFile(relativeFilePath, data, callback)
};
Transport.prototype.updateFile = function(relativeFilePath, data, callback) {
  var pathOnServer;

  pathOnServer = path.join(this.config.path, relativeFilePath);
  console.log("updating " + this.config.host + '/' + relativeFilePath);
  this.sftp.writeFile(pathOnServer, data, callback);
};
Transport.prototype.deleteFile = function(relativeFilePath, callback) {
  console.log("deleting " + this.config.host + '/' + relativeFilePath);
  this.sftp.unlink(relativeFilePath, callback)
};

Transport.prototype.createDirectory = function(relativeFilePath, callback) {
  console.log("creating " + this.config.host + '/' + relativeFilePath);
  this.sftp.mkdir(relativeFilePath, callback)
};
Transport.prototype.deleteDirectory = function(relativeFilePath, callback) {
  console.log("deleting " + this.config.host + '/' + relativeFilePath);
  this.sftp.rmdir(relativeFilePath, callback)
};

module.exports = Transport;