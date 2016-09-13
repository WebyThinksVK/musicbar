// Wrapper to work with Zip files
var Zip = function() {
    var self = this;
    this.zipFileEntry = null;
    this.writer = null;
    this.zipWriter = null;
    this.tmpFileName = "tmp.zip";
    this.downloadName = "tmp.zip";

    this.init = function() {
        zip.workerScripts = {
            deflater: ['/scripts/zip/z-worker.js', '/scripts/zip/pako/pako.min.js', '/scripts/zip/pako/codecs.js'],
            inflater: ['/scripts/zip/z-worker.js', '/scripts/zip/pako/pako.min.js', '/scripts/zip/pako/codecs.js']
        };
    };

    this.init();

    this.createInstance = function(fs, callback) {
        fs.root.getFile(self.tmpFileName, {
            create: true
        }, function (fileEntry) {
            self.zipFileEntry = fileEntry;
            self.writer = new zip.FileWriter(self.zipFileEntry);
            zip.createWriter(self.writer, function (writer) {
                self.zipWriter = writer;
                callback && callback();
            });
        });
    };

    this.createFile = function(name, callback) {
        webkitRequestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
            filesystem.root.getFile(self.tmpFileName, null, function (entry) {
                entry.remove(function() {
                    self.downloadName = name;
                    self.createInstance(filesystem, callback);
                });
            }, function() {
                self.downloadName = name;
                self.createInstance(filesystem, callback);
            });
        });
    };

    this.addFile = function(name, file, callback) {
        try{
            this.zipWriter.add(name, new zip.BlobReader(file), callback);
        } catch(e) {
            console.log(e);
            callback()
        }
    };

    this.download = function() {
        this.zipWriter.close(function(blob) {
            saveAs(blob, self.downloadName);
        });
    }
};