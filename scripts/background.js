




var connections = []; // Connections from pages
var activeConnection = null;
var ZipFile = new Zip();
var params = {
    surround: false,
    visualization: true,
    bitrate: true,
    playlists: false

};

var defaultEqualizers = [

    {
        name: "Хип-хоп",
        gains: [3.5, 3, 1 ,2, -0.8, -0.7, 1, -0.5, 1.2, 2],
        editable : true,
        active: false
    },

    {
        name: "Электро",
        gains: [2.9, 2.7, 1.9 , 0, -1.3, 1.5, 0.9, 1, 2.8, 3],
        editable : true,
        active: false
    },

    {
        name: "Джаз",
        gains: [2.8, 2, 1 ,1.5, -1, -1, 0, 1, 2, 2.5],
        editable : true,
        active: false
    },

    {
        name: "Рок",
        gains: [3.2, 2.8, 2 ,1, -0.8, -0.9, 0.2, 1.5, 2.2, 3],
        editable : true,
        active: false
    },

    {
        name: "Поп",
        gains: [-1, -0.8, 0 ,1.2, 3, 3, 1.2, 0, -0.8, -1],
        editable : true,
        active: false
    },

    {
        name: "Усиление баса",
        gains: [3.5, 2.8, 2.5 ,1.7, 1, 0 , 0, 0, 0, 0],
        editable : true,
        active: false
    },

    {
        name: "Выключен",
        gains: [0, 0, 0 ,0, 0, 0, 0, 0, 0, 0],
        editable : false,
        active: true
    },


];

var equalizers = defaultEqualizers;

// Override Audio PLayer
chrome.webRequest.onBeforeRequest.addListener(function(details) {

    if (details.url.match("audioplayer.js"))
        return {redirectUrl: chrome.extension.getURL('scripts/newAudioPlayer.js')};

    if (details.url.match("voice_message_player.js"))
        return {redirectUrl: chrome.extension.getURL('scripts/VoiceMessagePlayer.js')};

}, {urls: ["https://vk.com/js/cmodules/web/audioplayer.js?*", "https://vk.com/js/al/voice_message_player.js?*"]}, ["blocking"]);

// Run when user installed extension
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
    	chrome.storage.sync.set({
            equalizers: defaultEqualizers,
            params: params
        });
        setEqualizer(defaultEqualizers[0]);

    }else if(details.reason == "update"){
        console.log("update");

        chrome.storage.sync.set({
            params: {
                surround: false,
                visualization: true,
                bitrate: true,
                playlists: false
            }
        });
    }
});

// Event handler for message from pages
chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
 	sendResponse(parseMessageFromPage(message));
});

// Event handler for connection from page
chrome.runtime.onConnectExternal.addListener(function(port) {
	createConnection(port);

    port.postMessage({
        type: "initialize",
        params: params,
        equalizers: equalizers,
    });
	port.onMessage.addListener(function(msg) {
		port.postMessage(parseMessageFromPage(msg, port));
	});

	port.onDisconnect.addListener(function() {
		removeConnection(port);
	})
});

(function init() {

    // Get Equalizers and set active one
	chrome.storage.sync.get(["equalizers", "params"], function(items) {
        if (items.params) params = items.params;
        if (items.equalizers) equalizers = items.equalizers;
	});
})();

/**
 * Make ajax request and apply responseText to callback
 * @param url
 * @param callback
 */
function ajax(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback && callback.apply(xhr.responseText);
        }
    };
}

function setEqualizer(equalizer) {

    if (!equalizer) return false;

    // Set this equalizer active state
    equalizers.forEach(function(item, i) {

        item.active = i == equalizers.indexOf(equalizer);
    });

    // Save equalizers
    chrome.storage.sync.set({
        equalizers: equalizers,
        params: params
    });
}
/**
 * Create new connection
 * @param port
 * @returns {*}
 */
function createConnection(port) {
	connections.push(port);
	return connections[port];
}

/**
 * Remove connection and release event handlers
 * @param port
 */
function removeConnection(port) {
	connections.splice(connections.indexOf(port), 1);
}

/**
 * Parse message from page and answer, if necessary
 * @param message
 * @param port
 * @returns {*}
 */
function parseMessageFromPage(message, port) {
     console.log(params.bitrate);
	switch(message.type) {

		case "setEqualizer":
			setEqualizer(equalizers[message.number]);
			break;

        case "removeEqualizer":
            equalizers.splice(message.number, 1);
            chrome.storage.sync.set({equalizers: equalizers});
            break;

        case "setBitrateState":
            params.bitrate = message.state;
            chrome.storage.sync.set({params: params});

            break;

        case "setVisualization":
            params.visualization = message.state;
            chrome.storage.sync.set({params: params});
            break;

        case "saveEqualizer":
            var newEqualizer = {
                name: message.info.name,
                gains: message.info.gains,
                editable: true,
                active: true
            };

            if (message.info.index) {
                equalizers[message.info.index] = newEqualizer;
            } else {
                equalizers.push(newEqualizer);
            }
            setEqualizer(newEqualizer);
            break;

        case "setSurround":
            this.params.surround = message.state;
            setEqualizer();
            break;

        case "setPlaylists":
            this.params.playlists = message.state;
            setEqualizer();
            break;

        case "getEqualizers":
            return equalizers;

        case "download":
            chrome.downloads.download({
                url: message.url,
                filename: encode(message.name).replace(/[\\'"/]/g,"")
            });
            break;

        case "downloadPlaylist":
            ZipFile.createFile(message.title+".zip", function() {
                port.postMessage({type: "downloadNextSong"});
            });

            break;

        case "downloadNextSong":
            downloadNextSong(message, function() {
                port.postMessage({type: "downloadNextSong"});
            });
            break;

        case "downloadZip":
            ZipFile.download(message.title+".zip");
            break;

        case "findVideo":
            findVideo(message, port);
            break;

        case "findPerformer":
            findPerformer(message, port);
            break

        case "findChords":
            findChords(message, port);
            break;

        case "recognizeSpeech":
            recognizeSpeech(message.url, function(result) {
                port.postMessage({type: "recognizeSpeech", result: result, id: message.id});
            });
            break;

        case "calcBitrate":
            message.data.forEach(function(item) {
                calculateBitrate(item, function() {
                    port.postMessage({
                        type: "calcBitrate",
                        bitrate: this,
                        song: item.id
                    })
                })
            });
            break;
	}

	return {audio: message.type};
}

function findVideo(message, port) {
    var youtube = {
        key : 'AIzaSyBijnMMoonNTEk_A3uWv7tThqoZ1QExFkM'
    };

    ajax("https://www.googleapis.com/youtube/v3/search?q="+encode(message.name)+" official video&part=snippet&type=video&maxResults=1&key="+youtube.key, function() {
        var response = JSON.parse(this);

        if (!response.items) {
            port.postMessage({
                type: "findVideo",
                id: message.id,
                html: false
            });
        }
        var id = response.items[0].id.videoId;
        var html = '<div class="close" onclick="this.parentNode.remove(); event.stopPropagation();">&times;</div> <iframe id="audio_row_video_player" width="512" height="300" src="https://www.youtube.com/embed/' + id + '?color=white&theme=light&autohide=1&amp;wmode=opaque&amp;showinfo=0&enablejsapi=1&playerapiid=video_player&hd=1&vq=hd720" frameborder="0" allowfullscreen></iframe>';
        port.postMessage({
            type: "findVideo",
            id: message.id,
            html: html
        });
    });
}

function findPerformer(message, port) {
    var lastFM = {
        url		: 	"http://ws.audioscrobbler.com/2.0/?",
        method 	: 	"method=artist.getinfo&",
        lang	: 	"&lang=ru&",
        api_key : 	"api_key=e1394313a1c05c8142ebd4e68210fd03",
        format	:   "&format=json"
    };

    ajax(lastFM.url + lastFM.method + "artist="+ encode(message.performer) + lastFM.lang + lastFM.api_key + lastFM.format , function() {
        var data = JSON.parse(this);

        var artist = data.artist;

        console.log(artist);

        ajax(chrome.extension.getURL('modals/performer.html'), function() {

            if (!artist) {
                port.postMessage({
                    type: "findPerformer",
                    html: false
                });
                return false;
            }

            var html = this;

            var tags = "";
            var similar = "";

            artist.tags.tag.forEach(function(item) {
                tags += "<div class='tag'>"+item.name+"</div>";
            });

            artist.similar.artist.forEach(function(artist) {
                similar += "<a class=\"similar-band\" onclick=\" nav.change({ q: '"+artist.name+"', performer: 1 }, window, { searchPerformer: true }); curBox().hide();\">"+artist.name+"</a><br>";
            });



            html = html.replace(/%image_url%/, artist.image[2]["#text"]);
            html = html.replace(/%last_fm_url%/, artist.url);
            html = html.replace(/%band_name%/, artist.name);
            html = html.replace(/%tags%/, tags);
            html = html.replace(/%similar%/, similar);
            html = html.replace(/%bio%/, artist.bio.content.trim().replace(/<a (.*)/g, ""));

            port.postMessage({
                type: "findPerformer",
                html: html
            });
        })
    });
}

function encode(text) {
    var element = document.createElement("span");
    element.innerHTML = text;
    return element.innerText;
}

function findChords(message, port) {
    var closeBtnHtml = '<div class="close" onclick="this.parentNode.remove(); event.stopPropagation();">&times;</div>';

    findChordsUltimateGuitar(message.artist, message.song, function(chords) {

        if (!chords) {

            findChordEchords(message.artist, message.song, function (chords) {
                if (!chords) {
                    findChordsAdmd(message.artist, message.song, function (chords) {

                        if (!chords) {
                            port.postMessage({type: "findChords", html: false, id: message.id});
                            return;
                        }

                        port.postMessage({type: "findChords", html: closeBtnHtml + chords.innerHTML, id: message.id});
                    })
                } else {
                    port.postMessage({type: "findChords", html: closeBtnHtml + chords.innerHTML, id: message.id});
                }

            });
        } else {
            port.postMessage({type: "findChords", html: closeBtnHtml + chords.innerHTML, id: message.id});
        }
    });

}

function findChordEchords(artist, song, callback) {
    console.log("Search on E-chords...");
    var domParser = new DOMParser();

    artist = artist.toLowerCase().trim().replace(/([^A-zА-я ])/g, "").replace(/ /g,"-");
    song = song.toLowerCase().trim().replace(/([^A-zА-я ])/g, "").replace(/ /g,"-");


    ajax("http://www.e-chords.com/chords/"+artist+"/"+song, function() {
        var html = domParser.parseFromString(this, "text/html");
        var chords = html.querySelector("#core");
        callback(chords);
    });
}

function findChordsAdmd(artist, song, callback) {
    console.log("Search on Amdm...");
    var domParser = new DOMParser();

    ajax("http://amdm.ru/search/?q="+artist+" "+song, function() {
        html = domParser.parseFromString(this, "text/html");
        var songLink = html.querySelectorAll('.items .artist')[1];

        // If there is no link - fail;
        if (!songLink){
            callback(null);
            return false;
        }

        ajax(songLink.getAttribute('href').replace(/\/\//, "http://"), function() {
            html = domParser.parseFromString(this, "text/html");
            chords = html.querySelector('pre[itemprop="chordsBlock"]');
            callback(chords);
        })

    });
}

function findChordsUltimateGuitar(artist, song, callback) {
    console.log("Search on Ultimate guitar...");
    var domParser = new DOMParser();

    ajax("https://www.ultimate-guitar.com/search.php?search_type=title&order=&value="+artist+" "+song, function() {
        html = domParser.parseFromString(this, "text/html");

        var songLink = html.querySelectorAll('.song.result-link')[0];

        // If there is no link - fail;
        if (!songLink){
            callback(null);
            return false;
        }

        ajax(songLink.getAttribute('href'), function() {
            html = domParser.parseFromString(this, "text/html");
            chords = html.querySelector('.js-tab-content');
            callback(chords);
        })

    });
}

function downloadNextSong(info, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', info.url, true);
    xhr.responseType = "blob";
    xhr.overrideMimeType("application/octet-stream");
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var blob = new Blob([xhr.response], {type: "application/octet-stream"});

            ZipFile.addFile(encode(info.name).replace("/","") + ".mp3", blob, function() {
                callback && callback();
            });
        }
    };
}

function calculateBitrate(data, callback) {

    if (data.bitrate) {
        callback.apply(data.bitrate);
        return true;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', data.url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var size = xhr.getResponseHeader('Content-Length')*1;
            var bitrate = Math.floor(size/data.duration*8/1000);
            if (bitrate > 320) bitrate = 320;
            bitrate = bitrate / 32;
            bitrate = bitrate = bitrate.toFixed(0)*32;
            callback.apply(bitrate);
        }
    };
}

function getArrayBufferFromFile(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
        callback(this.response);
    };
    xhr.send();
}

function recognizeSpeech (url, callback) {
    getArrayBufferFromFile(url, function(data) {
        var blob = new Blob([data], {type: "audio/x-mpeg-3"});
        var xhr = new XMLHttpRequest();

        var key = 'f4e25547-6e68-413e-81f9-86483a8f420b';
        var uuid = createUUID();
        var url = "https://asr.yandex.net/asr_xml?key=" + key +"&uuid=" + uuid+"&topic=queries"

        xhr.open('POST',url, true);
        xhr.setRequestHeader("Content-Type", "audio/x-mpeg-3");

        xhr.onload = function(e) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(this.responseText, "text/xml");

            if (!dom) {
                callback &&callback({result: false, text: "Ошибка обработки ответа сервера"});
                return false;
            }
            var variants = Array.prototype.slice.call(dom.getElementsByTagName("variant"));

            if (!variants.length) {
                callback && callback({result: false, text: "Не удалось распознать речь"});
                return false;
            }

            var text = encode(variants[0].innerHTML);
            text = text[0].toUpperCase() + text.substring(1);

            callback &&callback({result: true, text: text});
        };

        xhr.onerror = function() {
            callback &&callback({result: false, text: "Не удалось выполнить запрос к серверу"});
            return false;
        };
        xhr.send(data);
    })
}

function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    var uuid = s.join("");
    return uuid;
}