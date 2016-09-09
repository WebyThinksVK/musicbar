var audioElement = new Audio(); // Main Audio Element
var context = new AudioContext(); // Audio context to work with sound
var analyser = context.createAnalyser();
var events = []; // Events from pages
var filters = []; // Filters for Equalizer
var AudioSource; // Audio source from <audio> element
var connections = []; // Connections from pages
var activeConnection = null;
var frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]; // Frequencies for Equalizer


var params = {
    surround: false,
    visualization: true
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
	return {redirectUrl: chrome.extension.getURL('scripts/AudioPlayer.js')};
}, {urls: ["https://vk.com/js/al/audioplayer.js?*"]}, ["blocking"]);

// Run when user installed extenstion
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
    	chrome.storage.sync.set({
            equalizers: defaultEqualizers,
            params: params
        });
        setEqualizer(defaultEqualizers[0]);

    }else if(details.reason == "update"){
        //var thisVersion = chrome.runtime.getManifest().version;
        //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
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
        active: port == activeConnection
    });
	port.onMessage.addListener(function(msg) {
		port.postMessage(parseMessageFromPage(msg, port));
	});

	port.onDisconnect.addListener(function() {
		removeConnection(port);
		if(!connections.length) {
            audioElement.pause();
            activeConnection = null;
        }
	})
});

(function init() {

	// Create Audio source from media element (<audio> element on background page)
	AudioSource = context.createMediaElementSource(audioElement);

	// Init filters for Equalizer
	for (var i = 0; i < frequencies.length; i++ ) {
		filters[i] = context.createBiquadFilter();
		filters[i].type = "peaking";
		filters[i].frequency.value = frequencies[i];
		filters[i].frequency.Q = 20;

		if (filters[i-1]) {
			filters[i-1].connect(filters[i]);
		}
	}

	// Connect audio source to the first filter
	AudioSource.connect(filters[0]);

	// Connect the last filter to the AudioContext's destination
	filters[filters.length-1].connect(context.destination);

    // Get Equalizers and set active one
	chrome.storage.sync.get(["equalizers", "params"], function(items) {
        if (items.params) params = items.params;

        if (items.equalizers) equalizers = items.equalizers;
        equalizers.forEach(function(item) {
            if (item.active) setEqualizer(item);
        });
	});

    createAnalyzer();

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
/**
 * Sets new equalizer params
 * @param gains array Gains for frequencies
 */
function setEqualizer(equalizer) {

    if (!equalizer) {
        equalizers.forEach(function(item) {
            if (item.active) equalizer = item;
        });
    }

	AudioSource.disconnect();
	filters[filters.length-1].disconnect();

	for (var i = 0; i < filters.length; i++ ) {

		filters[i].disconnect();
		filters[i].gain.value = equalizer.gains[i];

		if (filters[i-1])
			filters[i-1].connect(filters[i]);
	}

	AudioSource.connect(filters[0]);

    var soundNode = params.surround ? splitToSurround(filters[filters.length-1]) : filters[filters.length-1];
    if (params.visualization) {
        soundNode.connect(analyser);
    }

    soundNode.connect(context.destination);


    // Set this equalizer active state
    equalizers.forEach(function(item, i) {
       item.active = i == equalizers.indexOf(equalizer);
    });

    // Save equalizers
    chrome.storage.sync.set({
        equalizers: equalizers,
        params: params
    });

	console.log("Current equalizer: ", equalizer.gains.toString());
}

/**
 * Create new connection
 * @param port
 * @returns {*}
 */
function createConnection(port) {
	connections.push(port);

    console.log("connected");

    if (!activeConnection) activeConnection = port;

	return connections[port];
}

/**
 * Remove connection and release event handlers
 * @param port
 */
function removeConnection(port) {
	for (var i in events) {
		var event = events[i];
		if (event.port == connections.indexOf(port)) {
			audioElement.removeEventListener(event.handler, event.callback);
			events.splice(i, 1);
		}
	}

    if (port == activeConnection) {
        audioElement.pause();
    }
	connections.splice(connections.indexOf(port), 1);
}

/**
 * Parse message from page and answer, if necessary
 * @param message
 * @param port
 * @returns {*}
 */
function parseMessageFromPage(message, port) {
	switch(message.type) {
		case "setUrl":
			audioElement.setAttribute("src", message.url);
            if (port != activeConnection) {
                activeConnection.postMessage({
                    type:"pause"
                });
                activeConnection = port;
            }
			break;

		case "play":
			audioElement.play();
			break;

		case "setVolume":
			audioElement.volume = message.volume;
			break;

		case "setEqualizer":
			setEqualizer(equalizers[message.number]);
			break;

        case "removeEqualizer":
            equalizers.splice(message.number, 1);
            chrome.storage.sync.set({equalizers: equalizers});
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

        case "setVisualization":
            this.params.visualization = message.state;
            setEqualizer();
            break;

		case "seek":
			audioElement.currentTime = audioElement.duration * message.time;
			break;

		case "pause":
			audioElement.pause();
			break;

		case "getPlayedTime":
			return isNaN(audioElement.duration) ? 0 : Math.max(0, Math.min(1, audioElement.currentTime / audioElement.duration));

		case "getBuffered":
			return audioElement.buffered.length ? Math.min(1, audioElement.buffered.end(0) / audioElement.duration) : 0;

		case "getVolume":
			return audioElement.volume;

        case "getEqualizers":
            return equalizers;

		case "isActive":
			return port == activeConnection;

		case "addEvent":
			addEvent(message, port);
			break;
        case "download":
            chrome.downloads.download({
                url: message.url,
                filename: message.name
            });
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
	}

	return {audio: message.type};
}

/**
 * Add event handler to AudioElement
 * @param message
 * @param port
 */
function addEvent(message, port) {
	var fn = function() {

        if (port == activeConnection) {
            try {
                port.postMessage({ type: "runEvent", handler: message.handler})
            } catch(e) {};
        }
	};

	// Check is this event already exists
	for (var i in events) {
		var event = events[i];

		// If it is, release it
		if (event.handler == message.handler && event.port == port) {
			audioElement.removeEventListener(message.handler, event.callback);
			events.splice(i, 1);
		}
	}

	events.push({handler: message.handler, callback: fn,  port: port});
	audioElement.addEventListener(message.handler,fn);
}

/**
 * Split 2 channels for 6 and merge them
 * @param node
 * @returns {*}
 */
function splitToSurround(node) {
    context.destination.channelCount = context.destination.maxChannelCount;

    // Create audio nodes for 5.1
    var splitter = context.createChannelSplitter(2);
    var merger = context.createChannelMerger(6);

    var center = context.createChannelMerger(1);
    var sub = context.createChannelMerger(1);

    splitter.connect(center,0,0);
    splitter.connect(center,1,0);

    // В сабвуфер
    splitter.connect(sub,0,0);
    splitter.connect(sub,1,0);

    splitter.connect(merger,0,0); // передний левый
    splitter.connect(merger,1,1); // передний правый
    center.connect(merger,0,2); // центр
    sub.connect(merger,0,3); // бас


    splitter.connect(merger,0,4); // задний левый
    splitter.connect(merger,1,5); // задний правый

    node.connect(splitter);

    return merger;
}

function createAnalyzer() {

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 32;
    var bands = new Uint8Array(analyser.frequencyBinCount);

    var analyserNode = context.createScriptProcessor(256, 1, 1);
    analyser.connect(analyserNode);

    analyserNode.onaudioprocess = function () {
        analyser.getByteFrequencyData(bands);
    };

    window.setInterval(function(){
        if (params.visualization && !audioElement.paused) {
            activeConnection.postMessage({
                type: "visualization",
                bands: bands
            });
        }
    }, 100);


    analyserNode.connect(context.destination);

    return analyserNode;
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
            }

            var html = this;

            var tags = "";
            artist.tags.tag.forEach(function(item) {
                tags += "<div class='tag'>"+item.name+"</div>";
            });

            html = html.replace(/%image_url%/, artist.image[2]["#text"]);
            html = html.replace(/%last_fm_url%/, artist.url);
            html = html.replace(/%band_name%/, artist.name);
            html = html.replace(/%tags%/, tags);
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