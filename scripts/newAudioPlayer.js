if (typeof Array.prototype.forEach != 'function') {
    Array.prototype.forEach = function(callback){
        for (var i = 0; i < this.length; i++){
            callback.apply(this, [this[i], i, this]);
        }
    };
}

/*
 ___  ___          _     ______
 |  \/  |         (_)    | ___ \
 | .  . |_   _ ___ _  ___| |_/ / __ _ _ __
 | |\/| | | | / __| |/ __| ___ \/ _` | '__|
 | |  | | |_| \__ \ | (__| |_/ / (_| | |
 \_|  |_/\__,_|___/_|\___\____/ \__,_|_|

 */

var MusicBar = function(context) {
    var self = this;
    this.db = null;
    this.context = context;
    this.source = null;
    this.filters = [];
    this.frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.analyser = null;

    this.enabled = true;
    this.events = {};
    this.url = "";
    this.youtube = null;
    this.playlist = [];
    this.messagesToRecognize = [];
    this.playlistCount = 0;
    this.reloadAudioQueue = [];
    this.params = {
        surround : false,
        visualization: true,
        bitrate: true,
        playlists: false
    };

    this.equalizers = [];
    this.currentRow = null;
    this.panelHtml = "";

    // Connect to background
    if (this.connection  = chrome.runtime.connect(MusicBar.EXTENSION_ID)) {
        console.log("connected");
    }

    // Event handler
    this.connection.onMessage.addListener(function(msg) {
        self.onMessage(msg);
    });

    // Parse event
    this.onMessage = function(message) {
        switch(message.type) {
            case "initialize":
                this.init(message);
                break;
            case "findVideo":
                this.appendVideoBlock(message);
                break;
            case "findPerformer":
                this.showPerformer(message);
                break;
            case "findChords":
                this.appendChordsBlock(message);
                break;
            case "downloadNextSong":
                this.downloadNextSong();
                break;
            case "calcBitrate":
                this.setBitrate(message.song, message.bitrate);
                break;
            case "recognizeSpeech":
                var text = this.messagesToRecognize[message.id];
                if (text) text.innerText = message.result.text;
                break;
        }
    };

    this.createAnalyzer = function() {
        this.analyser = this.context.createAnalyser();

        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 32;
        var bands = new Uint8Array(this.analyser.frequencyBinCount);

        var analyserNode = this.context.createScriptProcessor(256, 1, 1);
        this.analyser.connect(analyserNode);

        analyserNode.onaudioprocess = function () {
            self.analyser.getByteFrequencyData(bands);
        };

        window.setInterval(function(){
            if (self.params.visualization) {
                self.updateVisualization(bands);
            }
        }, 100);

        analyserNode.connect(this.context.destination);

        return analyserNode;
    }

    this.splitToSurround = function (node) {
        this.context.destination.channelCount = this.context.destination.maxChannelCount;

        // Create audio nodes for 5.1
        var splitter = this.context.createChannelSplitter(2);
        var merger = this.context.createChannelMerger(6);

        var center = this.context.createChannelMerger(1);
        var sub = this.context.createChannelMerger(1);

        splitter.connect(center,0,0);
        splitter.connect(center,1,0);


        splitter.connect(sub,0,0);
        splitter.connect(sub,1,0);

        splitter.connect(merger,0,0);
        splitter.connect(merger,1,1);
        center.connect(merger,0,2);
        sub.connect(merger,0,3);


        splitter.connect(merger,0,4);
        splitter.connect(merger,1,5);

        node.connect(splitter);

        return merger;
    };

    this.setEqualizer = function(equalizer) {

        if (!equalizer) {
            this.equalizers.forEach(function(item) {
                if (item.active) equalizer = item;
            });
        }

        this.source.disconnect();
        this.filters[this.filters.length-1].disconnect();

        for (var i = 0; i < this.filters.length; i++ ) {

            this.filters[i].disconnect();
            this.filters[i].gain.value = equalizer.gains[i];

            if (this.filters[i-1])
                this.filters[i-1].connect(this.filters[i]);
        }

        this.source.connect(this.filters[0]);
        var soundNode = this.params.surround ? this.splitToSurround(this.filters[this.filters.length-1]) : this.filters[this.filters.length-1];
        soundNode.connect(this.context.destination);

        if (self.equalizers.indexOf(equalizer) > 0) {
            // Set this equalizer active state
            this.equalizers.forEach(function(item, i) {
                item.active = i == self.equalizers.indexOf(equalizer);
            });

            this.postMessage({
                type: "setEqualizer",
                number: self.equalizers.indexOf(equalizer)
            });
        }

    };

    // Init extension
    this.init = function(message) {
        this.params = message.params;
        this.equalizers = message.equalizers;
        this.source = getAudioPlayer()._impl._gainNode;

        // Init filters for Equalizer
        for (var i = 0; i < this.frequencies.length; i++ ) {
            this.filters[i] = this.context.createBiquadFilter();
            this.filters[i].type = "peaking";
            this.filters[i].frequency.value = this.frequencies[i];
            this.filters[i].frequency.Q = 20;

            if (this.filters[i-1]) {
                this.filters[i-1].connect(this.filters[i]);
            }
        }

        // Connect audio source to the first filter
        this.source.connect(this.filters[0]);
        this.source.connect(this.filters[0]);

        // Connect the last filter to the AudioContext's destination
        this.filters[this.filters.length-1].connect(this.context.destination);

        this.equalizers.forEach(function(item) {
            if (item.active) self.setEqualizer(item);
        });

        this.db = openDatabase('MusicBar', '1.0', 'Music Bar database', 4 * 1024 * 1024);
        this.db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS bitrates (song VARCHAR(30) UNIQUE, value)');
            //tx.executeSql("DROP TABLE bitrates");

            tx.executeSql("SELECT * FROM bitrates", [], function (tr, results) {

                if (results.rows.length > 100000) {
                    tx.executeSql("DELETE FROM bitrates");
                }

            })

        });

        // Hide playlists if necessary
        toggle(geByClass1("_audio_page_titled_block"), !this.params.playlists)
        toggleClass(geByClass1("audio_page_section_layout"), "no_playlists", this.params.playlists);
    }

    this.initAudioMessageParser = function() {
        if (window.cur.module != "im")  return;
        var chat = geByClass1("im-page-chat-contain");
        if (!chat) return;

        // This function sets new update audio messages
        var fn = function(mutations) {
            chat = geByClass1("im-page-chat-contain");

            var messages = geByClass("audio-msg-track", chat);

            messages.forEach(function(message) {
                if (hasClass(message, "parsed")) return;
                addClass(message, "parsed");

                var button = ce("div");
                addClass(button, "recognize-btn");
                attr(button, "onclick", " getAudioPlayer()._impl.musicBar.recognizeSpeech(this); event.stopPropagation(); return false;");

                domInsertAfter(button, geByClass1("audio-msg-track--btn", message))
            });
        };

        fn();

        var observer = new MutationObserver(fn);
        observer.observe(chat, {attributes: false, childList: true, characterData: false});

    };

    // Send messsage to bacgkround without answer
    this.postMessage = function(message, callback) {
        this.connection.postMessage(message, function(response) {
            if (callback) callback.apply(response);
        });
    };

    // Send message to background with answer
    this.sendMessage = function(message, callback) {
        chrome.runtime.sendMessage(MusicBar.EXTENSION_ID, message, function(response) {
            callback.apply(response);
        });
    };

    this.ajax = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send(); // (1)
        xhr.onreadystatechange = function() { // (3)

            if (xhr.readyState == 4) {
                callback.apply(xhr.responseText);
            }

        };
    };

    this.saveEqualizer = function(info) {
        this.postMessage({
            type: "saveEqualizer",
            info: info
        });

        var newEqualizer = {
            name: info.name,
            gains: info.gains,
            editable: true,
            active: true
        };

        if (info.index) {
            self.equalizers[info.index] = newEqualizer;
        } else {
            self.equalizers.push(newEqualizer);
        }
    };

    this.removeEqualizer = function(index) {
        this.postMessage({
            type: "removeEqualizer",
            number: index
        });
    };

    this.downloadSong = function(song) {
        var row = domClosest("_audio_row", song);
        var playlist = AudioUtils.getContextPlaylist(row);
        var data = playlist.getAudio(row.getAttribute("data-full-id"));

        getAudioPlayer()._ensureHasURL(data, function(response) {
            var data = AudioUtils.asObject(response);

            data.url = getAudioPlayer().unmask(data.url);

            self.postMessage({
                type: "download",
                url: data.url,
                name: data.performer + " - " + data.title + ".mp3"
            })
        })
    };

    this.unmaskUrl = function(t, i) {
        "use strict";
        function e(t) {
            if (~t.indexOf("audio_api_unavailable")) {
                var i = t.split("?extra=")[1].split("#")
                    , e = o(i[1]);
                if (i = o(i[0]),
                    !e || !i)
                    return t;
                e = e.split(String.fromCharCode(9));
                for (var a, r, l = e.length; l--; ) {
                    if (r = e[l].split(String.fromCharCode(11)),
                            a = r.splice(0, 1, i)[0],
                            !s[a])
                        return t;
                    i = s[a].apply(null, r)
                }
                if (i && "http" === i.substr(0, 4))
                    return i
            }
            return t
        }
        function o(t) {
            if (!t || t.length % 4 == 1)
                return !1;
            for (var i, e, o = 0, s = 0, r = ""; e = t.charAt(s++); )
                e = a.indexOf(e),
                ~e && (i = o % 4 ? 64 * i + e : e,
                o++ % 4) && (r += String.fromCharCode(255 & i >> (-2 * o & 6)));
            return r
        }
        Object.defineProperty(i, "__esModule", {
            value: !0
        }),
            i.audioUnmaskSource = e;
        var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/="
            , s = {
            v: function(t) {
                return t.split("").reverse().join("")
            },
            r: function(t, i) {
                t = t.split("");
                for (var e, o = a + a, s = t.length; s--; )
                    e = o.indexOf(t[s]),
                    ~e && (t[s] = o.substr(e - i, 1));
                return t.join("")
            },
            x: function(t, i) {
                var e = [];
                return i = i.charCodeAt(0),
                    each(t.split(""), function(t, o) {
                        e.push(String.fromCharCode(o.charCodeAt(0) ^ i))
                    }),
                    e.join("")
            }
        }
    };

    this.shareSong = function(song) {
        var row = domClosest("_audio_row", song);
        var id = row.getAttribute("data-full-id");
        showBox("like.php", {
            act: "publish_box",
            object: "audio" + id,
        }, {
            stat: ["page.js", "page.css", "wide_dd.js", "wide_dd.css", "sharebox.js"],
            onFail: function(t) {
                showDoneBox(t);
                return false;
            },
            onDone: function(box) {

                var check = ge("like_share_mail", box);

                if (!hasClass(check, 'disabled')) ShareBox.rbChanged(check, 2);
            }
        })
    };

    this.downloadPlaylist = function(playlist) {
        this.playlist = clone(playlist.getAudiosList());
        this.playlistCount =  this.playlist.length;

        var fn = function() {
            var playlistPanel = geByClass1("download-playlist");
            if (playlistPanel) {
                geByClass1("playlist_download_progress_bar", playlistPanel).style.width = "0%";
                geByClass1("playlist_download_progress_text", playlistPanel).innerText = "Загрузка 0%";
            }

            toggleClass(playlistPanel, "download", true);
            var name = document.querySelector(".ui_rmenu_pr .ui_rmenu_item_sel span");
            self.postMessage({
                type: "downloadPlaylist",
                title: name? name.innerText.trim() : "Музыка"
            })
        }

        if (this.playlistCount > 50) {
            var songsMorphy = "песен";
            switch(this.playlistCount%10) {
                case 1: songsMorphy = "песню"; break;
                case 2:
                case 3:
                case 4:songsMorphy = "песни"; break;
            }

            var box = new MessageBox({title: "Скачивание аудиозаписей", dark: 1});
            box.content("Вы уверены, что хотите скачать <b>"+this.playlistCount+"</b> "+songsMorphy+"? Это может занять продолжительное время. <br> <br> Вы также можете <a onclick='boxQueue.hideLast(); getAudioPlayer()._impl.musicBar.toggleSelect(true)'> выбрать нужные песни</a>.");

            box.addButton("Продолжить", function() {
                fn()
                box.hide();
            });

            box.addButton("Отмена", function() {
                self.playlist = [];
                self.playlistCount = 0;
                box.hide();
            }, "no");

            box.show();


        } else {
            fn();
        }
    }

    this.downloadSelected = function() {
        var playlist = new AudioPlaylist();


        [].slice.call(domQuery(".audio_row.selected")).forEach(function(row) {
            removeClass(row, "selected");
            var data = JSON.parse(row.getAttribute("data-audio"));
            playlist.addAudio(data);
        })

        this.downloadPlaylist(playlist);

        this.toggleSelect(false);
    }

    this.stopDownloadPlaylist = function() {
        this.playlist = [];
        this.playlistCount =  -1;
        var playlistPanel = geByClass1("download-playlist");
        toggleClass(playlistPanel, "download", false);
    }

    this.downloadNextSong = function() {
        var playlistPanel = geByClass1("download-playlist");
        var songData = this.playlist.pop();

        // If there is no more song is queue
        if (!songData) {
            toggleClass(playlistPanel, "download", false);

            // If we didn't prevent downloading
            if (this.playlistCount != -1) {
                this.postMessage({
                    type: "downloadZip"
                })
            }
            return false;
        }

        if (playlistPanel) {
            var percent = 100 - this.playlist.length / (this.playlistCount / 100);
            geByClass1("playlist_download_progress_bar", playlistPanel).style.width = percent.toFixed(4)+"%";
            geByClass1("playlist_download_progress_text", playlistPanel).innerText = "Загружено "+percent.toFixed(0)+"%";
        }

        var song = AudioUtils.asObject(songData);

        if (!song.url.length) {
            getAudioPlayer()._ensureHasURL(songData, function(response) {
                var data = AudioUtils.asObject(response);

                data.url = getAudioPlayer().unmask(data.url);
                self.postMessage({
                    type: "downloadNextSong",
                    url: data.url,
                    name: song.performer + " - " + song.title

                })
            })
        } else {
            self.postMessage({
                type: "downloadNextSong",
                url: song.url,
                name: song.performer + " - " + song.title
            })
        }
    }

    // Request music video
    this.findVideo = function(element) {
        var row = domClosest("_audio_row", element);
        var playlist = AudioUtils.getContextPlaylist(row);
        var data = playlist.getAudio(row.getAttribute("data-full-id"));
        data = AudioUtils.asObject(data);

        var videoBlock = geByClass1("audio_row_video_block");
        if (videoBlock) videoBlock.remove();

        self.postMessage({
            type: "findVideo",
            name: data.performer + " - " + data.title,
            id: row.getAttribute("id")
        })
    }
    // Append music video block
    this.appendVideoBlock = function(message) {
        var row = ge(message.id);

        if (!message.html) {
            var modal = showFastBox({
                title: "Поиск видеоклипа",
                dark: 1
            }, "Не удалось найти видеоклип для этой песни", "Закрыть", function(a) {
                modal.hide();
            })
            return false;
        }

        var videoBlock = ce("div");
        videoBlock.setAttribute("class", "audio_row_video_block")
        videoBlock.innerHTML = message.html;

        row.appendChild(videoBlock);

        this.youtube = new YT.Player('audio_row_video_player', {
            events: {
                onReady: function () {
                    console.log("video is ready");
                },
                onStateChange: function(state) {
                    if (state.data == 1) {
                        getAudioPlayer().pause();
                    }
                }
            }
        });
    }

    // Append music video block
    this.appendChordsBlock = function(message) {
        var row = ge(message.id);

        if (!message.html) {
            var modal = showFastBox({
                title: "Поиск аккордов",
                dark: 1
            }, "Не удалось найти аккорды для этой песни", "Закрыть", function(a) {
                modal.hide();
            })
            return false;
        }

        var chordsBlock = ce("div");
        chordsBlock.setAttribute("class", "audio_row_chords_block");
        chordsBlock.setAttribute("data-nodrag", "1");
        chordsBlock.innerHTML = message.html;
        row.appendChild(chordsBlock);
    }

    this.findPerformer = function(element) {
        var row = domClosest("_audio_row", element);
        var playlist = AudioUtils.getContextPlaylist(row);
        var data = playlist.getAudio(row.getAttribute("data-full-id"));
        data = AudioUtils.asObject(data);

        self.postMessage({
            type: "findPerformer",
            performer: data.performer,
        })
    };

    this.showPerformer = function(message) {
        var box = new MessageBox({width: 600});

        if (!message.html) {
            box = new MessageBox({title: "Об исполнителе"});
            box.content("Не удалось найти информацю об этом исполнителе");
        } else {
            box.content(message.html);
        }

        box.addButton("Закрыть");
        box.show();
    };

    this.findChords = function(element) {
        var row = domClosest("_audio_row", element);
        var playlist = AudioUtils.getContextPlaylist(row);
        var data = playlist.getAudio(row.getAttribute("data-full-id"));
        data = AudioUtils.asObject(data);

        var chordsBlock = geByClass1("audio_row_chords_block");
        if (chordsBlock) chordsBlock.remove();

        self.postMessage({
            type: "findChords",
            artist: data.performer,
            song: data.title,
            id: row.getAttribute("id")
        })
    };

    this.recognizeSpeech = function(element) {

        var message = domClosest("audio-msg-track", element);

        if (!attr(message, "data-mp3")) {
            message = domPS(message);
        }

        var url = attr(message, "data-mp3");
        var id = attr(message, "id");

        var text = geByClass1("text", message.parentNode);
        if (text) text.remove();

        text = ce("div");
        addClass(text, "text");
        text.innerText = "";

        message.parentNode.appendChild(text);
        this.messagesToRecognize.push(text);
        self.postMessage({
            type: "recognizeSpeech",
            url: url,
            id:  id =  this.messagesToRecognize.indexOf(text)
        });
    };

    this.setCurrentRow = function(element) {
        this.currentRow = element;
        if (geByTag1("canvas", this.currentRow)) return false;

        if (!domClosest("audio_playlist_wrap", this.currentRow)) return false;

        var canvas = ce("canvas");
        canvas.width = getSize(this.currentRow)[0];
        canvas.height = getSize(this.currentRow)[1];
        this.currentRow.appendChild(canvas);
    };

    this.updateVisualization = function(bands) {
        if (!this.currentRow) return false;
        if (!geByTag1("canvas", this.currentRow)) return false;

        var size = getSize(this.currentRow);

        var context = geByTag1("canvas", this.currentRow).getContext("2d");
        context.clearRect(0, 0, size[0], size[1]);
        //context.fillStyle = "rgba(245,247,255, 0.5)";
        context.fillStyle = "rgba(42, 88, 133, 0.05)";

        for (i=0; i<16; i++) {
            var height = bands[i]/10;
            context.fillRect(i* (size[0] / 16), 54-height, (size[0] / 16 - 3), height);
        }
    };

    this.addRowTemplate = function() {

        addTemplates({
            audio_row_advanced: '\
            <div class="audio_row _audio_row _audio_row_%1%_%0% %cls%" onclick="return getAudioPlayer().toggleAudio(this, event)" data-audio="%serialized%" data-full-id="%1%_%0%" id="audio_%1%_%0%">\
            <div class="audio_row_inner clear_fix">\
            <div class="select-check-wrapper" onclick="getAudioPlayer().toggleSelect(this)"> <div class="select-check" ></div> </div>\
            <div class="audio_row_counter"></div>\
            <div class="audio_row_cover_wrap _audio_row_cover_wrap">\
            <div class="audio_row_cover" style="%cover_style%"></div>\
            <div class="audio_row_cover_back"></div>\
            <div class="audio_row_cover_play_icon"></div>\
            </div>\
            <div class="audio_info">\
            <div class="audio_duration_wrap _audio_duration_wrap">\
            <div class="audio_hq_label">%bitrate%</div>\
            <div class="audio_duration _audio_duration">%duration%</div>\
            <div class="audio_acts clear_fix">\
            <div class="audio_act" id="actions" onclick="tooltips.hideAll(); fadeToggle(geByClass1(\'audio_row_dropdown\', this), 200); " onmouseover="showTooltip(this, {text: \'Действия\', black: 1, shift: [10, 6, 0], appendParentCls: \'audio_acts\'})" onclick="">\
                <div class="gear-icon"></div>\
                <div id="audio_row_dropdown" class="audio_row_dropdown" >\
                    <div class="rows" style="font-size: 13px;">\
                        <div class="header"><div id="privacy_header" class="header_label"><div class="gear-icon"></div>&nbsp;&nbsp; Действия</div></div>\
                        <div class="body">\
                            <div class="item" onclick="getAudioPlayer()._impl.musicBar.downloadSong(this)">Скачать</div>\
                            <div class="item" onclick="getAudioPlayer()._impl.musicBar.findPerformer(this)">Об исполнителе</div>\
                            <div class="item" onclick="getAudioPlayer()._impl.musicBar.findVideo(this)">Найти клип</div>\
                            <div class="item" onclick="getAudioPlayer()._impl.musicBar.findChords(this)">Найти аккорды</div>\
                            <div class="item" onclick="getAudioPlayer()._impl.musicBar.shareSong(this)">Отправить другу</div>\
                        </div>\
                    </div>\
                </div>\
            </div> \
            <div class="audio_act" id="recom" onmouseover="audioShowActionTooltip(this)" onclick="currentAudioPage(this).showRecoms(this, \'%1%_%0%\', event)"></div>\
            <div class="audio_act" id="next" onmouseover="audioShowActionTooltip(this)" onclick="getAudioPlayer().setNext(this, event)"></div>\
            <div class="audio_act" id="edit" onmouseover="audioShowActionTooltip(this)"onclick="currentAudioPage(this).editAudio(this, \'%1%_%0%\', event)"></div>\
            <div class="audio_act _audio_act_delete" id="delete" onclick="currentAudioPage(this).deleteAudio(this, \'%1%_%0%\', event)" onmouseover="audioShowActionTooltip(this)"></div>\
            <div class="audio_act" id="add" onclick="return addAudio(this, event)"onmouseover="audioShowActionTooltip(this)"></div>\
            </div>\
            </div>\
            <div class="audio_title_wrap"><a href="%search_href%" onmouseover="setTitle(this)" nodrag="1" onclick="return audioSearchPerformer(this, event)" class="audio_performer">%4%</a>\
            <span class="audio_info_divider">&ndash;</span><span class="audio_title _audio_title" onmouseover="setTitle(this, domPN(this))">\
            <span class="audio_title_inner" tabindex="0" nodrag="1" aria-label="%3%" onclick="return toggleAudioLyrics(event, this, \'%1%_%0%\', \'%9%\')">%3%</span>\
            <span class="audio_author">%8%</span>\
            </span>\
            </div>\
            </div>\
            <div class="_audio_player_wrap"></div>\
            <div class="_audio_lyrics_wrap audio_lyrics" data-nodrag="1"></div>\
            </div>\
            </div>'
        });
    };
    this.addRowTemplate();

    this.getVoiceMessageTemplate = function() {
        return '<div class="audio-msg-player audio-msg-track"><button class="audio-msg-track--btn"></button><div class="recognize-btn" onclick=" getAudioPlayer()._impl.musicBar.recognizeSpeech(this); event.stopPropagation(); return false;"></div><div class="audio-msg-track--duration"></div><div class="audio-msg-track--wave-wrapper"><div class="audio-msg-track--slider"></div></div></div>';
    };

    this.initPanel = function() {

        // Add canvas for visualization
        this.currentRow = geByClass1("audio_page_player");
        var canvas = ce("canvas");
        canvas.width = getSize(this.currentRow)[0] - 54
        canvas.height = getSize(this.currentRow)[1];
        this.currentRow.appendChild(canvas);

        // Set up settings toggles
        toggleClass(geByClass1("ui_toggler", geByClass1("surround_toggle")), "on", this.params.surround);
        toggleClass(geByClass1("ui_toggler", geByClass1("visualization_toggle")), "on", this.params.visualization);
        toggleClass(geByClass1("ui_toggler", geByClass1("playlists_toggle")), "on", this.params.playlists);
        toggleClass(ge("show_bitrate_checkbox"), "on", this.params.bitrate);

        // Show bitrate
        toggleClass(document.body, AudioUtils.AUDIO_HQ_LABEL_CLS,  this.params.bitrate);

        toggle(geByClass1("_audio_page_titled_block"), !this.params.playlists);
        toggleClass(geByClass1("audio_page_section_layout"), "no_playlists", this.params.playlists);


        if (this.playlist.length) {
            var percent = 100 - this.playlist.length / (this.playlistCount / 100);
            geByClass1("playlist_download_progress_bar").style.width = percent.toFixed(4)+"%";
            geByClass1("playlist_download_progress_text").innerText = "Загружено "+percent.toFixed(0)+"%";
            toggleClass(geByClass1("download-playlist"), "download", true);

        }

        if (geByClass1("blind_label", geByClass1("ui_rmenu_pr")))
            geByClass1("blind_label", geByClass1("ui_rmenu_pr")).remove(); // Remove hidden button title

        // Create new equalizer
        geByClass1("add_equalizer_item").addEventListener("click", function() {
            self.ajax(MusicBar.formEqualizerModalUrl, function() {
                var box = new MessageBox({dark: 1, title: "Добавить эквалайзер", bodyStyle: "padding: 20px; background-color: #fafbfc;"});
                box.content(this);

                // Update equalizer
                geByClass("gain_range", box.bodyNode).forEach(function(input) {
                    input.addEventListener("change", function() {
                        var gains = [];
                        each(geByClass("gain_range", box.bodyNode), function(i) {gains.push(this.value);});

                        self.setEqualizer({gains: gains});
                    });
                });

                // Set default preset
                var gains = [];
                each(geByClass("gain_range", box.bodyNode), function(i) {gains.push(this.value);});
                self.setEqualizer({gains: gains});

                // Save the Equalizer
                box.addButton("Сохранить", function() {
                    var gains = [];
                    each(geByClass("gain_range", box.bodyNode), function(i) {gains.push(this.value);});

                    // Send new equalizer to background
                    self.saveEqualizer({
                        name: ge("equalizer_title_edit", box.bodyNode).value,
                        gains: gains,
                    });

                    var index = geByClass("_audio_equalizer_item").length - 1;
                    var equalizer = self.createEqualizer({
                        name: ge("equalizer_title_edit", box.bodyNode).value,
                        gains: gains,
                        editable: true,
                        active: true
                    }, geByClass1("equalizer_template"), index);

                    geByClass1("equalizers_list").appendChild(equalizer);
                    geByClass1("equalizer_name").innerText = ge("equalizer_title_edit", box.bodyNode).value;

                    // Set this equalizer in active state
                    each(geByClass("_audio_equalizer_item"), function() {
                        toggleClass(this, "ui_rmenu_item_sel", this.getAttribute("data-index") == equalizer.getAttribute("data-index"));
                    });

                    self.setEqualizer(self.equalizers[equalizer.getAttribute("data-index")]);

                    // Hide the modal
                    box.hide();
                });

                box.addButton("Отмена", function() {
                    self.setEqualizer();
                    box.hide();
                }, "no");
                box.show();
            })
        });


        this.sendMessage({type: "getEqualizers"}, function() {

            var template = geByClass1("equalizer_template");

            this.forEach(function(item) {
                if (item.active) {
                    var name = geByClass1("audio_equalizer_title");
                    var title = geByClass1("equalizer_name");
                    title.innerHTML = item.name;
                }
            });

            // Add equalizers to list
            each(this, function(i) {
                var equalizer = self.createEqualizer(this, template, i);
                geByClass1("equalizers_list").appendChild(equalizer);

            });
        });
    };

    this.updateBitrate = function() {

        var countPerRequest = 10;
        var queue = [];

        each(domQuery(".page_block .audio_row"), function() {
            //if (!domClosest("audio_rows", this) && !domClosest("wall_audio_rows", this)) return;
            var bitrate = geByClass1("audio_hq_label", this).innerText;
            if (!bitrate.length) queue.push(this.getAttribute("data-full-id"));
        });

        for (var i = 0; i < queue.length / countPerRequest; i++) {
            var part = queue.slice(i * countPerRequest, i * countPerRequest + countPerRequest);

            self.reloadAudio(part, function(e, a) {

                if (a !== false) {
                    topMsg("Сервер перегружен. Подождите немного.", 30, '#FFB4A3');
                }

                var data = [];
                each(e, function(i, e) {
                    e = AudioUtils.asObject(e);

                    var a = {};
                    a[AudioUtils.AUDIO_ITEM_INDEX_URL] = e.url;
                    getAudioPlayer().updateAudio(e.fullId, a);

                    data.push({
                        id: e.fullId,
                        url: getAudioPlayer().unmask(e.url),
                        bitrate: e.bitrate,
                        duration: e.duration,
                    });
                })

                self.postMessage({
                    type: "calcBitrate",
                    data: data
                });
            })
        }
    }

    this.reloadAudio = function(ids, callback) {



        var timer = window.setTimeout(function() {
            // Song, whose bitrate we know
            var knownBitrates = [];

            self.db.transaction(function (tx) { // Get requested id's in BD
                tx.executeSql('SELECT * FROM bitrates WHERE song IN (' +'"' + ids.join('", "') + '"'+ ')', [], function (tx, results) {

                    // Loop for results
                    for( i in results.rows) {
                        var row = results.rows[i];
                        if (typeof(row) === "object" && row.value != 0) {
                            ids.splice(ids.indexOf(row.song), 1);
                            knownBitrates.push(row);
                        }
                    }

                    // Done function. e = array of audio datas, a - status (false, undefined)
                    var onDone = function(e, a) {

                        // Get audio data, set bitrate and push it to array
                        knownBitrates.forEach(function(song) {

                            if (ge("audio_" + song.song)) {
                                var data = JSON.parse(ge("audio_" + song.song).getAttribute("data-audio"));
                                data[AudioUtils.AUDIO_ITEM_INDEX_BITRATE] = song.value;

                                geByClass1("audio_hq_label", ge("audio_" + song.song)).innerText = song.value;

                                e.push(data);
                            }
                        })
                        callback(e, a);
                    };

                    // If we have songs, that bitrate we still don't know, request in from VK
                    if (ids.length) {
                        ajax.post("al_audio.php", {
                            act: "reload_audio",
                            ids: ids.join(","),
                            al: 1
                        }, {
                            onDone: onDone
                        })

                        // If we know all songs
                    } else {
                        onDone([], false);
                    }

                    self.reloadAudioQueue.splice(self.reloadAudioQueue.indexOf(timer), 1);

                });
            });

        }, 300 * this.reloadAudioQueue.length + 1);
        this.reloadAudioQueue.push(timer);
    }

    this.eraceReloadAudio = function(callback) {
        this.reloadAudioQueue.forEach(function(timer) {
            clearTimeout(timer);
        })
        this.reloadAudioQueue = [];

        callback && callback();
    }

    this.setBitrate = function(song, bitrate) {

        var rows = domQuery("[data-full-id='"+song+"']");
        rows.forEach(function(row) {
            if (row) {
                if (!geByClass1("audio_hq_label", row).innerText.length) {

                    var dataAudio = JSON.parse(row.getAttribute("data-audio"));
                    var e = AudioUtils.asObject(dataAudio);

                    var a = {};
                    a[AudioUtils.AUDIO_ITEM_INDEX_BITRATE] = bitrate;
                    getAudioPlayer().updateAudio(e.fullId, a);

                    geByClass1("audio_hq_label", row).innerText = bitrate;

                    self.db.transaction(function (tx) {
                        tx.executeSql('SELECT * FROM bitrates WHERE song = "'+e.fullId+'"', [], function (tx, results) {

                            if (results.rows.length) {
                                self.db.transaction(function (tx) {
                                    tx.executeSql('UPDATE bitrates SET bitrate = ? WHERE song = "?"', [bitrate, e.fullId]);
                                });
                            } else {
                                self.db.transaction(function (tx) {
                                    tx.executeSql('INSERT INTO bitrates (song, value) VALUES (?, ?)', [e.fullId, bitrate]);
                                });
                            }

                        });
                    });
                }
            }
        })
    }

    // Create new equalizer
    this.createEqualizer = function(info, template, index) {

        // Clone template to new one
        var equalizer = template.cloneNode(true);
        equalizer.classList.remove("unshown", "equalizer_template");
        if (info.active) equalizer.classList.add("ui_rmenu_item_sel");

        // Set index
        equalizer.setAttribute("data-index",index);

        // Set name
        geByClass1("audio_equalizer_title", equalizer).innerText = info.name;


        if (info.editable) {

            // Click on delete button
            geByClass1("audio_equalizer_del_btn", equalizer).addEventListener("click", function(e) {

                var equalizer = domClosest("_audio_equalizer_item", this);
                var modal = showFastBox({
                    title: "Удалить эквалайзер",
                    dark: 1
                }, "Вы уверены, что хотите удалить этот эквалайзер?", "Удалить", function(a) {
                    self.removeEqualizer(equalizer.getAttribute("data-index"));
                    modal.hide();
                    equalizer.remove();
                }, "Отмена");

                e.stopPropagation();
                return false;
            });

            // Click on edit button
            geByClass1("audio_equalizer_edit_btn", equalizer).addEventListener("click", function(e) {

                var element = domClosest("_audio_equalizer_item", this);
                var equalizer = self.equalizers[element.getAttribute("data-index")];

                self.ajax(MusicBar.formEqualizerModalUrl, function() {
                    var box = new MessageBox({dark: 1, title: "Редактировать эквалайзер", bodyStyle: "padding: 20px; background-color: #fafbfc;"});
                    box.content(this);

                    geByClass("gain_range", box.bodyNode).forEach(function(input) {
                        input.addEventListener("change", function() {
                            var gains = [];
                            each(geByClass("gain_range", box.bodyNode), function(i) {gains.push(this.value);});

                            self.setEqualizer({gains: gains});
                        });
                    });

                    // Set name to input field
                    ge("equalizer_title_edit", box.bodyNode).value = equalizer.name;

                    // Set gains to range inputs
                    each(geByClass("gain_range", box.bodyNode), function(i) { this.value = equalizer.gains[i]; });

                    // Save the Equalizer
                    box.addButton("Сохранить", function() {
                        var gains = [];
                        each(geByClass("gain_range", box.bodyNode), function(i) {gains.push(this.value);});

                        self.saveEqualizer({
                            name: ge("equalizer_title_edit", box.bodyNode).value,
                            gains: gains,
                            index: element.getAttribute("data-index")
                        });

                        self.setEqualizer(self.equalizers[element.getAttribute("data-index")]);

                        // Set new name to panel
                        geByClass1("audio_equalizer_title", element).innerText = ge("equalizer_title_edit", box.bodyNode).value;
                        geByClass1("equalizer_name").innerText = ge("equalizer_title_edit", box.bodyNode).value;

                        // Set this equalizer in active state
                        each(geByClass("_audio_equalizer_item"), function() {
                            toggleClass(this, "ui_rmenu_item_sel", this.getAttribute("data-index") == element.getAttribute("data-index"));
                        });

                        // Hide the modal
                        box.hide();
                    });

                    box.addButton("Отмена", function() {
                        self.setEqualizer();
                        box.hide();
                    }, "no");
                    box.show();
                });


                e.stopPropagation();
                return false;
            })
        } else {
            geByClass1("audio_album_btns", equalizer).remove();
        }

        equalizer.addEventListener("click", function() {
            each(geByClass("_audio_equalizer_item"), function() {this.classList.remove("ui_rmenu_item_sel")})
            this.classList.add("ui_rmenu_item_sel");

            self.setEqualizer(self.equalizers[this.getAttribute("data-index")]);

            var name = geByClass1("audio_equalizer_title", this);
            var title = geByClass1("equalizer_name");
            title.innerHTML = name.innerText;

            // Close panel
            uiRightMenu.toggleSubmenu('audio_equalizers');
        });

        return equalizer;
    };

    this.toggleVisualization = function(element) {
        toggleClass(geByClass1("ui_toggler", element), "on");
        this.params.visualization = Boolean(1 - this.params.visualization);

        if (!this.params.visualization) {
            this.updateVisualization([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        }

        this.postMessage({
            type: "setVisualization",
            state: this.params.visualization
        });
    }

    this.toggleSurround = function(element) {
        toggleClass(geByClass1("ui_toggler", element), "on");

        this.params.surround = Boolean(1 - this.params.surround);

        this.setEqualizer();

        this.postMessage({
            type: "setSurround",
            state: this.params.surround
        });
    };

    this.toggleBitrate = function(element, state, fromAudioPlayer) {


        if (fromAudioPlayer) {
            checkbox("show_bitrate_checkbox", state);
            this.params.bitrate = state;
        } else {
            this.params.bitrate = !this.params.bitrate;
            checkbox("show_bitrate_checkbox", this.params.bitrate);
            AudioUtils.toggleAudioHQBodyClass(this.params.bitrate, true);
        }

        this.postMessage({
            type: "setBitrateState",
            state:  this.params.bitrate
        })
    }

    this.togglePlaylists = function(element) {
        toggleClass(geByClass1("ui_toggler", element), "on");

        this.params.playlists = Boolean(1 - this.params.playlists);
        toggle(geByClass1("_audio_page_titled_block"), !this.params.playlists)
        toggleClass(geByClass1("audio_page_section_layout"), "no_playlists", this.params.playlists);

        this.postMessage({
            type: "setPlaylists",
            state: this.params.playlists
        });
    };

    this.toggleSelect = function(state) {
        var playlist = geByClass1('audio_page_sections');

        if (state === true) {
            state = toggleClass(playlist,'select-download', state);

            if (ge("download-panel")) return false;

            this.ajax(MusicBar.selectHtmlUrl, function() {
                var selectPanel = ce("div", {
                    id: "download-panel"
                })

                selectPanel.innerHTML = this;
                playlist.appendChild(selectPanel);

                var rows = geByClass1("audio_rows");

                var size = getSize(rows);
                var pos = getXY(rows);
                var edge = size[1] + pos[1];

                if (window.innerHeight - 50 > edge) {
                    addClass(ge("download-panel"), "absolute");
                }

                // If panel is under audio_rows, attach it to bottom
                toggleClass(ge("download-panel"), "absolute", window.scrollY - 50 > edge - window.innerHeight)
                window.addEventListener("scroll", function() {
                    size = getSize(rows);
                    pos = getXY(rows);
                    edge = size[1] + pos[1];
                    toggleClass(ge("download-panel"), "absolute", window.scrollY - 50 > edge - window.innerHeight)
                })

            })
        } else {
            var selectPanel = ge("download-panel");
            if (selectPanel) selectPanel.remove();
            toggleClass(geByClass1('audio_page_sections'),'select-download', false);

            [].slice.call(domQuery(".audio_row.selected")).forEach(function(row){
                removeClass(row, "selected");
            })
        }
    }
};

MusicBar.EXTENSION_ID = "mienmjdbnnpaigifneeiifdbjkdgelha";
MusicBar.panelHtmlUrl = "chrome-extension://" + MusicBar.EXTENSION_ID + "/panel.html";
MusicBar.selectHtmlUrl = "chrome-extension://" + MusicBar.EXTENSION_ID + "/modals/select.html";
MusicBar.formEqualizerModalUrl = "chrome-extension://" + MusicBar.EXTENSION_ID + "/modals/form_equalizer.html";






/*
 ___            _ _      ______ _
 / _ \          | (_)     | ___ \ |
 / /_\ \_   _  __| |_  ___ | |_/ / | __ _ _   _  ___ _ __
 |  _  | | | |/ _` | |/ _ \|  __/| |/ _` | | | |/ _ \ '__|
 | | | | |_| | (_| | | (_) | |   | | (_| | |_| |  __/ |
 \_| |_/\__,_|\__,_|_|\___/\_|   |_|\__,_|\__, |\___|_|
 __/ |
 |___/
 */



!function(t) {
    function e(o) {
        if (i[o])
            return i[o].exports;
        var a = i[o] = {
            exports: {},
            id: o,
            loaded: !1
        };
        return t[o].call(a.exports, a, a.exports, e),
            a.loaded = !0,
            a.exports
    }
    var i = {};
    return e.m = t,
        e.c = i,
        e.p = "",
        e(0)
}([function(t, e, i) {
    t.exports = i(11)
}
    , function(module, exports) {
        "use strict";
        function _classCallCheck(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(exports, "__esModule", {
            value: !0
        });
        var AudioLayer = function() {
            function AudioLayer() {
                _classCallCheck(this, AudioLayer),
                    this._els = {
                        layerPlace: ge("top_audio_layer_place"),
                        topPlayBtn: geByClass1("_top_audio_player_play"),
                        topNotaBtn: geByClass1("_top_nav_audio_btn")
                    }
            }
            return AudioLayer.prepare = function(t) {
                stManager.add(["audio.js", "audioplayer.js", "audio.css", "suggester.js", "auto_list.js", "indexer.js"], function() {
                    t && t()
                })
            }
                ,
                AudioLayer.prototype.toggle = function(t) {
                    var e = this;
                    this._initTooltip();
                    var i = this._els.tt
                        , o = void 0 !== t ? t : !i.isShown();
                    o ? (i.show(),
                        cancelStackPush("top_audio", function() {
                            e.toggle()
                        }, !0)) : (cancelStackPop(),
                        i.hide()),
                        toggleClass(this._els.topNotaBtn, "active", o)
                }
                ,
                AudioLayer.prototype.hide = function() {
                    this._els.tt.hide()
                }
                ,
                AudioLayer.prototype.isShown = function() {
                    return this._els.tt && this._els.tt.isShown()
                }
                ,
                AudioLayer.prototype.updatePosition = function() {
                    return this._els.tt && this._els.tt.updatePosition()
                }
                ,
                AudioLayer.prototype._layerPosition = function() {
                    var t = getXY(this._els.layerPlace)
                        , e = getXY("page_body")
                        , i = e[0] - t[0] - 1
                        , o = 0;
                    if (isVisible(this._els.topNotaBtn)) {
                        var a = getXY(this._els.topNotaBtn);
                        o = -i + (a[0] - t[0]) + 14
                    } else {
                        var s = getXY(this._els.topPlayBtn);
                        o = -i + (s[0] - t[0]) + 1
                    }
                    return {
                        left: i,
                        top: 0,
                        arrowPosition: o
                    }
                }
                ,
                AudioLayer.prototype.getPageInstance = function() {
                    return this._page
                }
                ,
                AudioLayer.prototype._initTooltip = function _initTooltip() {
                    var _this2 = this;
                    this._els.tt || (this._els.container = se('<div class="audio_layer_container"><div class="top_audio_loading">' + rs(vk.pr_tpl, {
                            id: "",
                            cls: "pr_big"
                        }) + "</div></div>"),
                        this._els.tt = new ElementTooltip(this._els.layerPlace,{
                            id: "audio_layer_tt",
                            content: this._els.container,
                            width: 660,
                            offset: [22, 5],
                            autoShow: !1,
                            setPos: this._layerPosition.bind(this),
                            forceSide: "bottom",
                            onHide: function() {
                                _this2._page && _this2._page.onLayerHide()
                            },
                            onShow: function() {
                                _this2._page && _this2._page.onLayerShow(_this2._initSection)
                            }
                        }),
                        ajax.post("al_audio.php", {
                            act: "layer",
                            is_layer: 1,
                            is_current_playlist: ap.getCurrentPlaylist() ? 1 : 0
                        }, {
                            onDone: function onDone(html, data, templatesScript) {
                                eval(templatesScript),
                                    _this2._els.container.innerHTML = html,
                                    _this2._page = new AudioPage(geByClass1("_audio_page_layout", _this2._els.container),data),
                                    _this2._initSection = "recoms" == data.initSection ? data.initSection : void 0,
                                    _this2._page.onLayerShow(_this2._initSection)
                            }
                        }))
                }
                ,
                AudioLayer
        }();
        exports["default"] = AudioLayer
    }
    , function(t, e) {
        "use strict";
        function i(t) {
            if (~t.indexOf("audio_api_unavailable")) {
                var e = t.split("?extra=")[1].split("#")
                    , i = o(e[1]);
                if (e = o(e[0]),
                    !i || !e)
                    return t;
                i = i.split(String.fromCharCode(9));
                for (var a, r, l = i.length; l--; ) {
                    if (r = i[l].split(String.fromCharCode(11)),
                            a = r.splice(0, 1, e)[0],
                            !s[a])
                        return t;
                    e = s[a].apply(null, r)
                }
                if (e && "http" === e.substr(0, 4))
                    return e
            }
            return t
        }
        function o(t) {
            if (!t || t.length % 4 == 1)
                return !1;
            for (var e, i, o = 0, s = 0, r = ""; i = t.charAt(s++); )
                i = a.indexOf(i),
                ~i && (e = o % 4 ? 64 * e + i : i,
                o++ % 4) && (r += String.fromCharCode(255 & e >> (-2 * o & 6)));
            return r
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        }),
            e.audioUnmaskSource = i;
        var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/="
            , s = {
            v: function(t) {
                return t.split("").reverse().join("")
            },
            r: function(t, e) {
                t = t.split("");
                for (var i, o = a + a, s = t.length; s--; )
                    i = o.indexOf(t[s]),
                    ~i && (t[s] = o.substr(i - e, 1));
                return t.join("")
            },
            x: function(t, e) {
                var i = [];
                return e = e.charCodeAt(0),
                    each(t.split(""), function(t, o) {
                        i.push(String.fromCharCode(o.charCodeAt(0) ^ e))
                    }),
                    i.join("")
            }
        }
    }
    , , , , , , , , , function(module, exports, __webpack_require__) {
        "use strict";
        function _interopRequireDefault(t) {
            return t && t.__esModule ? t : {
                "default": t
            }
        }
        function _loadAllPlaylistAudios(t, e) {
            if (!t.hasMore() || !t.isFullyLoadable())
                return e && e();
            var i, o, a;
            !function() {
                var s = function() {
                    if (a)
                        return e && e(null, a);
                    var o = [];
                    each(i, function(t, e) {
                        e && (o = o.concat(e))
                    }),
                        each(getAudioPlayer().getPlaylists(), function(e, i) {
                            i.getId() == t.getId() && (i._list = o)
                        }),
                        getAudioPlayer().mergePlaylistData(t, {
                            hasMore: !1
                        }),
                    e && e(t)
                }
                    , r = function(e, s) {
                    ajax.post("al_audio.php", {
                        act: "load_section",
                        type: t.getType(),
                        owner_id: t.getOwnerId(),
                        playlist_id: t.getPlaylistId(),
                        access_hash: t.getAccessHash(),
                        offset: e * AUDIO_LOAD_CHUNK_SIZE,
                        is_loading_all: 1
                    }, {
                        onDone: function(r, l, n) {
                            if (0 == e) {
                                if (addTemplates({
                                        audio_playlist_snippet: l
                                    }),
                                        extend(cur.lang, n),
                                        !r)
                                    return a = !0,
                                        s();
                                o = r.totalCount,
                                    getAudioPlayer().mergePlaylistData(t, r)
                            }
                            i[e] = r.list,
                                s()
                        }
                    })
                }
                    , l = function(t, e) {
                    var i = Math.max(0, Math.ceil(o / AUDIO_LOAD_CHUNK_SIZE) - e);
                    if (i)
                        for (var a = new callHub(t,i), s = e; i > s; s++)
                            r(s, function() {
                                a.done()
                            });
                    else
                        t()
                };
                i = [],
                    o = t.getTotalCount(),
                    a = !1,
                    void 0 === o ? r(0, function() {
                        l(s, 1)
                    }) : l(s, 0)
            }()
        }
        function _updateAudioSoundBars(t, e, i) {
            var o = t.getContext("2d");
            o.clearRect(0, 0, t.width, t.height),
                o.fillStyle = i ? "#3D6899" : "#ffffff";
            for (var a = 12, s = 0; 4 > s; s++) {
                var r = 2 + e[s] * a;
                o.fillRect(10 + 4 * s, a - r + 11, 2, r)
            }
        }
        var _audio_unmask_source = __webpack_require__(2)
            , _audio_layer = __webpack_require__(1)
            , _audio_layer2 = _interopRequireDefault(_audio_layer);
        window.AudioLayer = _audio_layer2["default"],
            window.AudioUtils = {
                AUDIO_ITEM_INDEX_ID: 0,
                AUDIO_ITEM_INDEX_OWNER_ID: 1,
                AUDIO_ITEM_INDEX_URL: 2,
                AUDIO_ITEM_INDEX_TITLE: 3,
                AUDIO_ITEM_INDEX_PERFORMER: 4,
                AUDIO_ITEM_INDEX_DURATION: 5,
                AUDIO_ITEM_INDEX_ALBUM_ID: 6,
                AUDIO_ITEM_INDEX_AUTHOR_LINK: 8,
                AUDIO_ITEM_INDEX_LYRICS: 9,
                AUDIO_ITEM_INDEX_FLAGS: 10,
                AUDIO_ITEM_INDEX_CONTEXT: 11,
                AUDIO_ITEM_INDEX_EXTRA: 12,
                AUDIO_ITEM_INDEX_HASHES: 13,
                AUDIO_ITEM_INDEX_COVER_URL: 14,
                AUDIO_ITEM_INDEX_BITRATE: 15,
                AUDIO_ITEM_INLINED_BIT: 1,
                AUDIO_ITEM_CLAIMED_BIT: 16,
                AUDIO_ITEM_RECOMS_BIT: 64,
                AUDIO_ITEM_TOP_BIT: 1024,
                AUDIO_ITEM_LONG_PERFORMER_BIT: 16384,
                AUDIO_ITEM_LONG_TITLE_BIT: 32768,
                AUDIO_ENOUGH_LOCAL_SEARCH_RESULTS: 500,
                AUDIO_PLAYING_CLS: "audio_row_playing",
                AUDIO_CURRENT_CLS: "audio_row_current",
                AUDIO_LAYER_HEIGHT: 550,
                AUDIO_LAYER_MIN_WIDTH: 400,
                AUDIO_LAYER_MAX_WIDTH: 1e3,
                AUDIO_HQ_LABEL_CLS: "audio_hq_label_show",
                AUDIO_MAX_AUDIOS_IN_SNIPPET: 5,
                AUDIO_ROW_COVER_SIZE: 34,
                updateBitrateTimer: null,
                idsToQuery : [],
                onAudioChoose: function(t, e, i, o) {
                    if (isUndefined(e.selected)) {
                        var a = cur.attachCount && cur.attachCount() || 0;
                        cur.chooseMedia("audio", i.fullId, o),
                        (!cur.attachCount || cur.attachCount() > a) && cur.lastAddMedia && (e.selected = cur.lastAddMedia.chosenMedias.length - 1,
                            addClass(domPN(e), "audio_selected"),
                            e.innerHTML = getLang("global_cancel"))
                    } else
                        cur.lastAddMedia.unchooseMedia(e.selected),
                            e.selected = void 0,
                            removeClass(domPN(e), "audio_selected"),
                            e.innerHTML = getLang("global_add_media");
                    return cancelEvent(t)
                },
                onPlaylistChoose: function(t, e) {
                    var i = e.getAccessHash();
                    cur.chooseMedia("audio_playlist", e.getOwnerId() + "_" + e.getPlaylistId() + (i ? ":" + i : ""), {
                        id: e.getPlaylistId(),
                        coverUrl: e.getCoverUrl(),
                        gridCovers: e.getGridCovers(),
                        title: e.getTitle(),
                        authorName: e.getAuthorName(),
                        authorHref: e.getAuthorHref()
                    })
                },
                editPlaylist: function(t, e) {
                    stManager.add(["audio.js", "audio.css", "auto_list.js"], function() {
                        AudioPage.editPlaylist(t, e, "edit")
                    })
                },
                followPlaylist: function(t, e, i, o) {
                    function a(o) {
                        var a = domData(t, "text-followed")
                            , s = domData(t, "text-follow");
                        a && s && (t.innerHTML = o ? a : s),
                            l.setFollowed(o);
                        var r = l.getAddClasses() || "";
                        r = r.replace("audio_pl__followed", ""),
                        o && (r += " audio_pl__followed"),
                            l.mergeWith({
                                addClasses: r
                            }),
                            each(geByClass("_audio_pl_" + e + "_" + i), function(t, e) {
                                toggleClass(e, "audio_pl__followed", o)
                            })
                    }
                    if (vk && vk.widget && !vk.id && window.Widgets)
                        return Widgets.oauth(),
                            !1;
                    var s = gpeByClass("_audio_pl", t)
                        , r = toggleClass(s, "audio_pl__followed")
                        , l = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_PLAYLIST, e, i);
                    a(r),
                        ajax.post("al_audio.php", {
                            act: "follow_playlist",
                            playlist_owner_id: e,
                            playlist_id: i,
                            hash: o
                        }, {
                            onFail: function(t) {
                                var e = new MessageBox({
                                    title: getLang("global_error")
                                });
                                return e.content(t).setButtons("Ok", function() {
                                    curBox().hide()
                                }).show(),
                                    a(!1),
                                    !0
                            }
                        })
                },
                getLayer: function() {
                    var t = window.audioLayer;
                    return t || (window.audioLayer = t = new _audio_layer2["default"]),
                        t
                },
                updateQueueReceivedPost: function(t) {
                    t && each(geByClass("_audio_row", t), function() {
                        domData(this, "new-post", "groups" == cur.module ? "wall" : "feed")
                    })
                },
                toggleAudioHQBodyClass: function(s, fromMusicBar) {
                    var t;

                    if (typeof s != "undefined") {
                        t = s;
                        getAudioPlayer().showHQLabel(s);
                    } else {
                        t = getAudioPlayer().showHQLabel();
                    }

                    toggleClass(document.body, AudioUtils.AUDIO_HQ_LABEL_CLS, t);
                    if (!fromMusicBar) getAudioPlayer()._impl.musicBar.toggleBitrate(null, t, true);
                },
                hasAudioHQBodyClass: function() {
                    return hasClass(document.body, AudioUtils.AUDIO_HQ_LABEL_CLS)
                },
                showNeedFlashBox: function() {
                    var t = getLang("global_audio_flash_required").replace("{link}", '<a target=_blank href="https://get.adobe.com/flashplayer">').replace("{/link}", "</a>");
                    new MessageBox({
                        title: getLang("audio_need_flash_title")
                    }).content(t).setButtons("Ok", function() {
                        curBox().hide()
                    }).show()
                },
                getAddRestoreInfo: function() {
                    return cur._audioAddRestoreInfo = cur._audioAddRestoreInfo || {},
                        cur._audioAddRestoreInfo
                },
                addAudio: function(t) {
                    function e() {
                        return intval(domData(o, "in-progress"))
                    }
                    function i(t) {
                        return domData(o, "in-progress", intval(t))
                    }
                    if (vk && vk.widget && !vk.id && window.Widgets)
                        return Widgets.oauth(),
                            !1;
                    var o = gpeByClass("_audio_row", t);
                    if (!e()) {
                        i(!0);
                        var a = window.AudioPage && currentAudioPage(o)
                            , s = a && a.getOwnerId() < 0 && a.canAddToGroup()
                            , r = s ? -a.getOwnerId() : 0
                            , l = AudioUtils.getAudioFromEl(o, !0)
                            , n = AudioUtils.getAddRestoreInfo()
                            , u = n[l.fullId]
                            , d = ge("audio_" + l.fullId);
                        d = d == o ? !1 : d;
                        var _ = a && a.getPageCurrentPlaylist()
                            , c = {
                            act: "add",
                            group_id: r,
                            audio_owner_id: l.ownerId,
                            audio_id: l.id,
                            hash: l.addHash
                        };
                        u ? "recom_hidden" == u.state ? a && (a.restoreRecommendation(o),
                            i(!1)) : "deleted" == u.state ? (ajax.post("al_audio.php", {
                            act: "restore_audio",
                            oid: l.ownerId,
                            aid: l.id,
                            hash: l.editHash
                        }, {
                            onDone: function() {
                                i(!1)
                            }
                        }),
                            removeClass(o, "audio_deleted"),
                            removeClass(o, "canadd"),
                            addClass(o, "canedit"),
                            delete cur._audioAddRestoreInfo[l.fullId]) : "added" == u.state && (ajax.post("al_audio.php", {
                            act: "delete_audio",
                            oid: u.audio.ownerId,
                            aid: u.audio.id,
                            hash: u.audio.editHash
                        }, {
                            onDone: function() {
                                if (a) {
                                    var t = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_ALBUM, r ? -r : vk.id, AudioPlaylist.ALBUM_ALL);
                                    t.removeAudio(u.addedFullId)
                                }
                                i(!1)
                            }
                        }),
                            removeClass(o, "added"),
                            addClass(o, "canadd"),
                        d && (removeClass(d, "added"),
                            addClass(d, "canadd")),
                            delete cur._audioAddRestoreInfo[l.fullId],
                            getAudioPlayer().notify(AudioPlayer.EVENT_REMOVED, l.fullId, u.addedFullId)) : (ajax.post("al_audio.php", c, {
                            onDone: function(t) {
                                if (t) {
                                    var e = t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + t[AudioUtils.AUDIO_ITEM_INDEX_ID];
                                    n[l.fullId] = {
                                        state: "added",
                                        addedFullId: e,
                                        audio: AudioUtils.asObject(t)
                                    };
                                    var o = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_PLAYLIST, r ? -r : vk.id, AudioPlaylist.DEFAULT_PLAYLIST_ID);
                                    o.addAudio(t, 0)
                                }
                                i(!1)
                            },
                            onFail: function(t) {
                                return t && new MessageBox({
                                    title: getLang("global_error")
                                }).content(t).setButtons("Ok", function() {
                                    curBox().hide()
                                }).show(),
                                    removeClass(o, "added"),
                                    addClass(o, "canadd"),
                                    i(!1),
                                    !0
                            }
                        }),
                            removeClass(o, "canadd"),
                            addClass(o, "added"),
                        d && (removeClass(d, "canadd"),
                            addClass(d, "added")),
                            getAudioPlayer().notify(AudioPlayer.EVENT_ADDED, l.fullId),
                        a && a.onUserAction(l, _))
                    }
                },
                addAudioFromChooseBox: function(t, e, i, o, a, s, r) {
                    var l = e.ctrlKey;
                    t.innerHTML = "",
                        showProgress(t),
                        ajax.post("al_audio.php", {
                            act: "add",
                            gid: a,
                            oid: i,
                            aid: o,
                            hash: s
                        }, {
                            onDone: function(e) {
                                var i = a ? -a : vk.id;
                                if (e) {
                                    var o = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_ALBUM, i, AudioPlaylist.ALBUM_ALL);
                                    o.addAudio(e, 0),
                                    cur.audioPage && cur.audioPage.switchToSection(o)
                                }
                                if (l)
                                    hideProgress(t),
                                        domReplaceEl(t, '<span class="choose_link audio_choose_added_label">' + r + "</span>");
                                else
                                    for (; __bq.count(); )
                                        __bq.hideLast();
                                nav.go("audios" + i)
                            }
                        })
                },
                addAudioToOwner: function(t, e) {
                    return window.onAudioPageLoaded = function() {
                        return this.uploadAudio({})
                    }
                        ,
                        nav.go("audios" + t),
                        cancelEvent(e)
                },
                chooseAudioBox: function(t, e, i) {
                    if (void 0 !== t.selected)
                        cur.lastAddMedia.unchooseMedia(t.selected),
                            t.selected = void 0,
                            removeClass(domPN(t), "audio_selected"),
                            t.innerHTML = e.labels.add;
                    else {
                        var o = cur.attachCount && cur.attachCount() || 0;
                        cur.chooseMedia("audio", e.owner_id + "_" + e.id, e.info),
                        (!cur.attachCount || cur.attachCount() > o) && cur.lastAddMedia && (t.selected = cur.lastAddMedia.chosenMedias.length - 1,
                            addClass(domPN(t), "audio_selected"),
                            t.innerHTML = e.labels.cancel)
                    }
                    return cancelEvent(i)
                },
                drawAudio: function(t, e) {
                    for (var i = JSON.parse(getTemplate("audio_bits_to_cls")), o = t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS], a = [], s = 0; 32 > s; s++) {
                        var r = 1 << s;
                        o & r && a.push(i[r])
                    }
                    e && a.push(e);

                    var mb = getAudioPlayer()._impl.musicBar;
                    var fullId = t[1] + "_" +t[0];
                    this.idsToQuery.push(fullId);

                    if (mb) {
                        var au = this;

                        clearTimeout(this.updateBitrateTimer);
                        this.updateBitrateTimer = window.setTimeout(function() {
                            getAudioPlayer().db.transaction(function(tr) {
                                tr.executeSql('SELECT * FROM bitrates WHERE song IN (' +'"' + au.idsToQuery.join('", "') + '"'+ ')', [], function (tx, results) {

                                    if (results.rows.length) {
                                        // Loop for results
                                        for( i in results.rows) {
                                            var data = results.rows.item(i);

                                            var row = domQuery(".page_block #audio_"+data.song+" .audio_hq_label");
                                            if (results.rows.length && row.length && data.value != 0)
                                                row[0].innerText = data.value;
                                        }
                                    }
                                    if (mb.params.bitrate) mb.updateBitrate();
                                });

                                AudioUtils.idsToQuery = [];
                            })
                        }, 100)
                    }

                    var l = "";
                    if (t[AudioUtils.AUDIO_ITEM_INDEX_COVER_URL]) {
                        var n = t[AudioUtils.AUDIO_ITEM_INDEX_COVER_URL].split(",");
                        l = "background-image: url(" + n[0] + ")"
                    }
                    var u = formatTime(t[AudioUtils.AUDIO_ITEM_INDEX_DURATION])
                        , d = t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER].replace(/<\/?em>/g, "")
                        , _ = clean(JSON.stringify(t)).split("$").join("$$")
                        , c = getTemplate("audio_row_advanced", t);
                    return c = c.replace(/%cls%/, a.join(" ")),
                        c = c.replace(/%duration%/, u),
                        c = c.replace(/%serialized%/, _),
                        c = c.replace(/%cover_style%/, l),
                        c = c.replace(/%bitrate%/, ""),
                        c = c.replace(/%search_href%/, "/search?c[q]=" + encodeURIComponent(d) + "&c[section]=audio&c[performer]=1")
                },
                isRecomAudio: function(t) {
                    return t = AudioUtils.asObject(t),
                    t.flags & AudioUtils.AUDIO_ITEM_RECOMS_BIT
                },
                isClaimedAudio: function(t) {
                    return t = AudioUtils.asObject(t),
                    t.flags & AudioUtils.AUDIO_ITEM_CLAIMED_BIT
                },
                getAudioExtra: function(t) {
                    return t = AudioUtils.asObject(t),
                        JSON.parse(t.extra || "{}")
                },
                getAudioFromEl: function(t, e) {
                    t = domClosest("_audio_row", t);
                    var i = data(t, "audio");
                    return i || (i = JSON.parse(domData(t, "audio"))),
                        e ? AudioUtils.asObject(i) : i
                },
                showAudioLayer: function showAudioLayer(btn) {
                    function initLayer(html, playlist, options, firstSong, script) {
                        var telContent = ap.layer.getContent();
                        addClass(telContent, "no_transition"),
                            removeClass(telContent, "top_audio_loading"),
                            telContent.innerHTML = html,
                            eval(script);
                        var layerScrollNode = geByClass1("audio_layer_rows_wrap", telContent);
                        setStyle(layerScrollNode, "height", AudioUtils.AUDIO_LAYER_HEIGHT),
                            options.layer = ap.layer,
                            options.layer.sb = new Scrollbar(layerScrollNode,{
                                nomargin: !0,
                                right: vk.rtl ? "auto" : 0,
                                left: vk.rtl ? 0 : "auto",
                                global: !0,
                                nokeys: !0,
                                scrollElements: [geByClass1("audio_layer_menu_wrap", telContent)]
                            }),
                            data(layerScrollNode, "sb", options.layerScrollbar);
                        var audioPage = new AudioPage(geByClass1("_audio_layout", telContent),playlist,options,firstSong);
                        data(ap.layer, "audio-page", audioPage),
                            setTimeout(function() {
                                removeClass(telContent, "no_transition")
                            })
                    }
                    var ap = getAudioPlayer()
                        , currentPlaylist = ap.getCurrentPlaylist();
                    if (ap.layer)
                        if (ap.layer.isShown())
                            ap.layer.hide(),
                                cancelStackFilter("top_audio", !0);
                        else {
                            ap.layer.show();
                            var initFunc = data(ap.layer, "init-func");
                            if (initFunc)
                                data(ap.layer, "init-func", null),
                                    initFunc();
                            else {
                                var audioPage = data(ap.layer, "audio-page");
                                audioPage && audioPage.onShow()
                            }
                            addClass(btn, "active"),
                                cancelStackPush("top_audio", function() {
                                    ap.layer.hide()
                                }, !0)
                        }
                    else {
                        var BORDER_COMPENSATION, attachTo;
                        !function() {
                            var t = function() {
                                return geByClass1("_im-page-wrap") || ge("page_body")
                            }
                                , e = function() {
                                return Math.max(AudioUtils.AUDIO_LAYER_MIN_WIDTH, Math.min(AudioUtils.AUDIO_LAYER_MAX_WIDTH, getSize(t())[0] - BORDER_COMPENSATION))
                            };
                            BORDER_COMPENSATION = 2,
                                attachTo = ge("top_audio_layer_place"),
                                ap.layer = new ElementTooltip(attachTo,{
                                    delay: 0,
                                    content: rs(vk.pr_tpl, {
                                        id: "",
                                        cls: "pr_big"
                                    }),
                                    cls: "top_audio_loading top_audio_layer",
                                    autoShow: !1,
                                    forceSide: "bottom",
                                    onHide: function(t, e) {
                                        audioPage = data(ap.layer, "audio-page"),
                                        audioPage && audioPage.onHide(),
                                            removeClass(btn, "active"),
                                        e && cancelStackFilter("top_audio", !0)
                                    },
                                    width: e,
                                    setPos: function() {
                                        var t, e, i;
                                        isVisible(btn) ? (e = t = btn,
                                            i = 2) : (t = attachTo,
                                            e = geByClass1("top_audio_player_play"),
                                            i = 3);
                                        var o = getXY(t)
                                            , a = getXY(e)
                                            , s = getSize(e)
                                            , r = getXY("page_body")
                                            , l = o[0] - r[0];
                                        if (l = Math.min(l, 400),
                                                s[0]) {
                                            var n = l + (a[0] - o[0]) + s[0] / 2 - i;
                                            setPseudoStyle(this.getContent(), "after", {
                                                left: n + "px"
                                            })
                                        }
                                        return {
                                            marginLeft: -l
                                        }
                                    }
                                }),
                                ap.layer.show(),
                                addClass(btn, "active"),
                                ajax.post("al_audio.php", {
                                    act: "show_layer",
                                    my: currentPlaylist ? 0 : 1
                                }, {
                                    onDone: function(t, e, i, o, a) {
                                        var s = e;
                                        ap.layer.isShown() ? initLayer(t, s, i, o, a) : data(ap.layer, "init-func", initLayer.pbind(t, s, i, o, a))
                                    }
                                }),
                                cancelStackPush("top_audio", function() {
                                    ap.layer.hide()
                                }, !0)
                        }()
                    }
                },
                asObject: function(t) {
                    if (!t)
                        return null;
                    if (isObject(t))
                        return t;
                    if ("string" == typeof t)
                        return {
                            id: t
                        };
                    var e = (t[AudioUtils.AUDIO_ITEM_INDEX_HASHES] || "").split("/")
                        , i = (t[AudioUtils.AUDIO_ITEM_INDEX_COVER_URL] || "").split(",");
                    return {
                        id: intval(t[AudioUtils.AUDIO_ITEM_INDEX_ID]),
                        owner_id: intval(t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID]),
                        ownerId: t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID],
                        fullId: t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + t[AudioUtils.AUDIO_ITEM_INDEX_ID],
                        title: t[AudioUtils.AUDIO_ITEM_INDEX_TITLE],
                        performer: t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER],
                        duration: intval(t[AudioUtils.AUDIO_ITEM_INDEX_DURATION]),
                        lyrics: intval(t[AudioUtils.AUDIO_ITEM_INDEX_LYRICS]),
                        url: t[AudioUtils.AUDIO_ITEM_INDEX_URL],
                        flags: t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS],
                        context: t[AudioUtils.AUDIO_ITEM_INDEX_CONTEXT],
                        extra: t[AudioUtils.AUDIO_ITEM_INDEX_EXTRA],
                        isTop: t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS] & AudioUtils.AUDIO_ITEM_TOP_BIT,
                        addHash: e[0] || "",
                        editHash: e[1] || "",
                        actionHash: e[2] || "",
                        isLongPerformer: t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS] & AudioUtils.AUDIO_ITEM_LONG_PERFORMER_BIT,
                        isLongTitle: t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS] & AudioUtils.AUDIO_ITEM_LONG_TITLE_BIT,
                        coverUrl_s: i[0],
                        coverUrl_p: i[1]
                    }
                },
                initDomPlaylist: function(t, e) {
                    var i = [];
                    return each(e, function(t, e) {
                        e && each(geByClass("_audio_row", e), function(t) {
                            i.push(AudioUtils.getAudioFromEl(this))
                        })
                    }),
                        t.addAudio(i),
                        t
                },
                getContextPlaylist: function(t) {
                    function e(t) {
                        return [].slice.call(t)
                    }
                    var i, o = getAudioPlayer(), a = AudioUtils.getAudioFromEl(t, !0), s = null, r = [], l = domData(t, "new-post"), n = null, u = AudioPlaylist.TYPE_TEMP, d = vk.id, _ = {}, c = [], h = t, A = window.AudioPage && currentAudioPage(t), y = gpeByClass("_audio_page_playlist", t) || gpeByClass("_audio_pl", t);
                    if (y) {
                        if (n = data(y, "playlist"),
                                !n) {
                            var p = (domData(y, "playlist-id") || "").split("_");
                            n = o.getPlaylist.apply(o, p);
                            var f = domData(y, "access-hash") || "";
                            f && n.mergeWith({
                                accessHash: f
                            })
                        }
                        for (; h = domPN(h); )
                            c.push((h.id ? "#" + h.id : "") + (h.className ? "." + h.className : ""));
                        c = c.slice(0, 30),
                            c = c.filter(function(t) {
                                return !!trim(t)
                            }),
                            c = c.reverse().join(" / "),
                            c = document.location.href + " : " + c
                    } else if (A && A.getPageCurrentPlaylist())
                        n = A.getPageCurrentPlaylist();
                    else if (0 === a.context.indexOf("module")) {
                        var P = a.context.replace("module", "");
                        n = o.getPlaylist(AudioPlaylist.TYPE_ALBUM, P || cur.oid || vk.id, AudioPlaylist.ALBUM_ALL),
                            r = [s]
                    } else if (0 === a.context.indexOf("im"))
                        s = gpeByClass("_im_peer_history", t),
                            s = s || gpeByClass("_fc_tab_log_msgs", t),
                            i = "im" + (cur.peer || "");
                    else if (0 === a.context.indexOf("board"))
                        i = a.context,
                            r = e(geByClass("_wall_audio_rows", s));
                    else if (0 === a.context.indexOf("widget"))
                        i = a.context;
                    else if (0 === a.context.indexOf("wiki"))
                        i = "wiki";
                    else if (0 === a.context.indexOf("post")) {
                        u = AudioPlaylist.TYPE_WALL,
                            i = a.context;
                        var g = a.context.replace("post", "").split("_");
                        d = g[0],
                            _ = {
                                postId: g[1]
                            }
                    } else if (0 === a.context.indexOf("choose"))
                        i = a.context;
                    else if ("feed" == l || 0 === a.context.indexOf("feed") || 0 === a.context.indexOf("feedsearch"))
                        i = "feed",
                            r = e(geByClass("wall_text", s));
                    else if (0 === a.context.indexOf("wall") || 0 === a.context.indexOf("reply") || "wall" == l) {
                        u = AudioPlaylist.TYPE_WALL,
                            d = cur.oid;
                        var g = "";
                        if (l) {
                            var E = gpeByClass("_post", t);
                            E && (g = domData(E, "post-id"))
                        } else
                            g = a.context.replace(/wall|reply/, "");
                        g = g ? g.split("_")[1] : "";
                        var v = cur.wallQuery || ""
                            , m = ge("wall_search")
                            , T = inArray(cur.wallType, ["own", "full_own"]) ? "own" : "all";
                        i = hashCode(T + "_" + v),
                        "wall" == cur.module && val(m) && (v = val(m)),
                        g && (_ = {
                            postId: g,
                            wallQuery: v,
                            wallType: T
                        });
                        var I = 0 === a.context.indexOf("reply");
                        I && (r = e([gpeByClass("_replies_list", t)]),
                            i = "reply" + i),
                            r = r.concat(e([s]))
                    } else {
                        for (; h = domPN(h); )
                            c.push((h.id ? "#" + h.id : "") + (h.className ? "." + h.className : ""));
                        c = c.slice(0, 30),
                            c = c.filter(function(t) {
                                return !!trim(t)
                            }),
                            c = c.reverse().join(" / "),
                            c = document.location.href + " : " + c
                    }
                    return s || (s = domPN(t)),
                        r = r.filter(function(t) {
                            return !!t
                        }),
                    r && 0 != r.length || (r = [s]),
                        n = n ? n : o.getPlaylist(u, d, i),
                        n = n.getAudiosCount() ? n : AudioUtils.initDomPlaylist(n, r),
                        n.mergeWith(_ || {}),
                    -1 == n.indexOfAudio(a) && (n = AudioUtils.initDomPlaylist(n, [domPN(t)])),
                        n
                },
                LOG_LS_KEY: "audiolog",
                debugLog: function() {},
                renderAudioDiag: function() {
                    var t = ge("audio_diag_log")
                        , e = ls.get(AudioUtils.LOG_LS_KEY) || [];
                    t && each(e, function(e, i) {
                        var o = new Date(i.shift()).toUTCString();
                        i = i.join(", "),
                            t.appendChild(se('<div class="audio_diag_log_row"><span class="audio_diag_log_time">' + o + "</span>" + i + "</div>"))
                    })
                },
                claim: function(t) {
                    var e = AudioUtils.getAudioFromEl(t, !0)
                        , i = AudioUtils.getAudioExtra(e);
                    ajax.post("al_claims.php", {
                        act: "a_claim",
                        claim_id: i.moder_claim.claim,
                        type: "audio",
                        id: e.id,
                        owner_id: e.owner_id
                    }, {
                        onDone: function(e) {
                            var i = gpeByClass("audio_row", t);
                            addClass(i, "claimed claim_hidden")
                        }
                    })
                },
                unclaim: function(t) {
                    var e = AudioUtils.getAudioFromEl(t, !0)
                        , i = AudioUtils.getAudioExtra(e);
                    ajax.post("al_claims.php", {
                        act: "a_unclaim",
                        claim_id: i.moder_claim.claim,
                        type: "audio",
                        id: e.id,
                        owner_id: e.owner_id,
                        hash: e.actionHash
                    }, {
                        onDone: function() {
                            var e = gpeByClass("audio_row", t);
                            removeClass(e, "claimed"),
                                removeClass(e, "claim_hidden")
                        }
                    })
                },
                getUMAInfo: function(t) {
                    var e = AudioUtils.getAudioFromEl(t, !0);
                    showBox("al_audio.php", {
                        act: "get_uma_restrictions",
                        id: e.id,
                        owner_id: e.owner_id,
                        hash: e.actionHash
                    })
                }
            },
            window.TopAudioPlayer = function(t, e) {
                this.ap = getAudioPlayer(),
                    this._el = t,
                    this._playIconBtn = ge("top_audio"),
                    this.init()
            }
            ,
            TopAudioPlayer.TITLE_CHANGE_ANIM_SPEED = 190,
            TopAudioPlayer.init = function() {
                var t = ge("top_audio_player")
                    , e = data(t, "object");
                e || (e = new TopAudioPlayer(t),
                    data(t, "object", e))
            }
            ,
            TopAudioPlayer.prototype.init = function() {
                function t(t) {
                    return hasClass(this, "top_audio_player_play") ? (e.ap.isPlaying() ? e.ap.pause() : e.ap.play(),
                        !1) : hasClass(this, "top_audio_player_prev") ? (e.ap.playPrev(),
                        !1) : hasClass(this, "top_audio_player_next") ? (e.ap.playNext(),
                        !1) : void 0
                }
                var e = this;
                this.ap.on(this, AudioPlayer.EVENT_UPDATE, this.onPlay.bind(this)),
                    this.ap.on(this, AudioPlayer.EVENT_PLAY, this.onPlay.bind(this)),
                    this.ap.on(this, AudioPlayer.EVENT_PAUSE, this.onPause.bind(this)),
                    this.ap.top = this,
                    each(["prev", "play", "next"], function(i, o) {
                        addEvent(geByClass1("top_audio_player_" + o, e._el), "click", t)
                    }),
                    addEvent(this._el, "mousedown", function(t) {
                        return hasClass(domPN(t.target), "top_audio_player_btn") ? void 0 : (1 != t.which || hasClass(t.target, "top_audio_player_btn") || hasClass(t.target, "top_audio_player_act_icon") || AudioUtils.getLayer().toggle(),
                            cancelEvent(t))
                    }),
                    addEvent(ge("top_audio"), "mousedown", function(t) {
                        return AudioUtils.getLayer().toggle(),
                            cancelEvent(t)
                    }),
                    this.onPlay(this.ap.getCurrentAudio())
            }
            ,
            TopAudioPlayer.prototype.onPlay = function(t, e, i) {
                function o() {
                    var e = getAudioPlayer();
                    setTimeout(function() {
                        var t = AudioUtils.getLayer();
                        t && t.isShown() && t.updatePosition()
                    }, 1),
                        addClass(r._el, a),
                        toggleClass(r._el, "top_audio_player_playing", e.isPlaying());
                    var o = geByClass1("_top_audio_player_play_blind_label");
                    o && (o.innerHTML = e.isPlaying() ? getLang("global_audio_pause") : getLang("global_audio_play")),
                        t = AudioUtils.asObject(t),
                        clearTimeout(r._currTitleReTO);
                    var s = geByClass1("top_audio_player_title_out", r._el);
                    re(s);
                    var l = geByClass1("top_audio_player_title", r._el);
                    if (0 != i) {
                        var n = 0 > i ? -10 : 10
                            , u = l.offsetLeft
                            , d = se('<div class="top_audio_player_title top_audio_player_title_next" style="opacity: 0; top:' + n + "px; left: " + u + 'px">' + t.performer + " &ndash; " + t.title + "</div>");
                        d.setAttribute("onmouseover", "setTitle(this)"),
                            i > 0 ? domInsertAfter(d, l) : domInsertBefore(d, l),
                            addClass(l, "top_audio_player_title_out"),
                            setStyle(l, {
                                top: -n,
                                opacity: 0
                            }),
                            setTimeout(function() {
                                setStyle(d, {
                                    top: 0,
                                    opacity: 1
                                })
                            }, 10),
                            clearTimeout(r._currTitleReTO),
                            r._currTitleReTO = setTimeout(function() {
                                re(l),
                                    removeClass(d, "top_audio_player_title_next")
                            }, TopAudioPlayer.TITLE_CHANGE_ANIM_SPEED)
                    } else
                        l.innerHTML = t.performer + " &ndash; " + t.title,
                            l.titleSet = 0,
                            l.setAttribute("onmouseover", "setTitle(this)")
                }
                var a = "top_audio_player_enabled";
                if (!t) {
                    removeClass(this._playIconBtn, a),
                        removeClass(this._el, a),
                        removeClass(this._el, "top_audio_player_playing"),
                        show(this._playIconBtn);
                    var s = AudioUtils.getLayer();
                    return void (s && s.isShown() && s.updatePosition())
                }
                var r = this;
                i = intval(i),
                    hasClass(this._playIconBtn, a) ? o() : (addClass(this._playIconBtn, a),
                        setTimeout(function() {
                            hide(r._playIconBtn),
                                o()
                        }, 150))
            }
            ,
            TopAudioPlayer.prototype.onPause = function() {
                removeClass(this._el, "top_audio_player_playing");
                var t = geByClass1("_top_audio_player_play_blind_label");
                t && (t.innerHTML = getLang("global_audio_play"))
            }
            ,
            TopAudioPlayer.prototype.onNext = function() {}
            ,
            window.AudioPlaylist = function t(e, i, o) {
                if (this.constructor != t)
                    throw new Error("AudioPlaylist was called without 'new' operator");
                getAudioPlayer().addPlaylist(this);
                var a = {};
                return e && isFunction(e.getId) ? (this._ref = e,
                    void getAudioPlayer().addPlaylist(this)) : (isObject(e) ? a = e : (a.ownerId = i,
                    a.type = e,
                    a.albumId = o || ++t.plIndex),
                    this._type = a.type,
                    this._ownerId = a.ownerId || vk.id,
                    this._albumId = a.albumId || 0,
                    this._list = [],
                    this._playbackParams = a.playbackParams,
                    this.mergeWith(a),
                    this)
            }
            ,
            AudioPlaylist.plIndex = 0,
            AudioPlaylist.TYPE_CURRENT = "current",
            AudioPlaylist.TYPE_PLAYLIST = "playlist",
            AudioPlaylist.TYPE_ALBUM = "album",
            AudioPlaylist.TYPE_TEMP = "temp",
            AudioPlaylist.TYPE_RECOM = "recoms",
            AudioPlaylist.TYPE_POPULAR = "popular",
            AudioPlaylist.TYPE_SEARCH = "search",
            AudioPlaylist.TYPE_FEED = "feed",
            AudioPlaylist.TYPE_LIVE = "live",
            AudioPlaylist.TYPE_WALL = "wall",
            AudioPlaylist.TYPE_RECENT = "recent",
            AudioPlaylist.ALBUM_ALL = -2,
            AudioPlaylist.DEFAULT_PLAYLIST_ID = -1,
            AudioPlaylist.prototype.serialize = function() {
                var t = {}
                    , e = getAudioPlayer().getCurrentAudio()
                    , i = Math.max(0, this.indexOfAudio(e));
                return t.list = clone(this.getAudiosList().slice(Math.max(0, i - 300), i + 300), !0),
                    each(t.list, function(t, e) {
                        e[AudioUtils.AUDIO_ITEM_INDEX_URL] = ""
                    }),
                    t.type = AudioPlaylist.TYPE_TEMP,
                    t.ownerId = vk.id,
                    t.albumId = irand(1, 999),
                    t.hasMore = !1,
                    t.title = this.getTitle(),
                    t.playbackParams = this.getPlaybackParams(),
                    JSON.stringify(t)
            }
            ,
            AudioPlaylist.prototype.getId = function() {
                return this.getType() + "_" + this.getOwnerId() + "_" + this.getAlbumId()
            }
            ,
            AudioPlaylist.prototype.isReference = function() {
                return !!this._ref
            }
            ,
            AudioPlaylist.prototype.getSelf = function() {
                return this._ref && isObject(this._ref) ? this._ref : this
            }
            ,
            AudioPlaylist.prototype._unref = function() {
                var t = this._ref;
                if (isObject(t)) {
                    for (var e in t)
                        if (t.hasOwnProperty(e) && !isFunction(t[e]) && 0 == e.indexOf("_")) {
                            var i = t[e];
                            params[e.substr(1)] = isObject(i) ? clone(i) : i
                        }
                    delete params.ownerId,
                        delete params.hasMore,
                        delete this._ref,
                        this._type = AudioPlaylist.TYPE_TEMP,
                        this._ownerId = params.ownerId || vk.id,
                        this._albumId = AudioPlaylist.plIndex++,
                        this._hasMore = !1,
                        this._list = [],
                        this.mergeWith(params)
                }
            }
            ,
            AudioPlaylist.prototype.isAdsAllowed = function() {
                return this._ref && isObject(this._ref) ? this._ref : this
            }
            ,
            AudioPlaylist.prototype.getType = function() {
                return this.getSelf()._type
            }
            ,
            AudioPlaylist.prototype.getOwnerId = function() {
                return this.getSelf()._ownerId
            }
            ,
            AudioPlaylist.prototype.getAlbumId = function() {
                return this.getSelf()._albumId
            }
            ,
            AudioPlaylist.prototype.getPlaylistId = function() {
                return this.getSelf()._albumId
            }
            ,
            AudioPlaylist.prototype.isFollowed = function() {
                return this.getSelf()._isFollowed
            }
            ,
            AudioPlaylist.prototype.setFollowed = function(t) {
                var e = this.getAddClasses() || "";
                return e = e.replace("audio_playlist__followed", ""),
                t && (e += " audio_playlist__followed"),
                    this.getSelf()._addClasses = e,
                    this.getSelf()._isFollowed = t
            }
            ,
            AudioPlaylist.prototype.getFollowHash = function() {
                return this.getSelf()._followHash
            }
            ,
            AudioPlaylist.prototype.getRawId = function() {
                return this.getSelf()._rawId
            }
            ,
            AudioPlaylist.prototype.getGridCovers = function() {
                return this.getSelf()._gridCovers || ""
            }
            ,
            AudioPlaylist.prototype.getTitle = function() {
                return this.getSelf()._title || ""
            }
            ,
            AudioPlaylist.prototype.getDescription = function() {
                return this.getSelf()._description || ""
            }
            ,
            AudioPlaylist.prototype.getAccessHash = function() {
                return this.getSelf()._accessHash || ""
            }
            ,
            AudioPlaylist.prototype.getAuthorLine = function() {
                return this.getSelf()._authorLine || ""
            }
            ,
            AudioPlaylist.prototype.getAuthorHref = function() {
                return this.getSelf()._authorHref || ""
            }
            ,
            AudioPlaylist.prototype.getAuthorName = function() {
                return this.getSelf()._authorName || ""
            }
            ,
            AudioPlaylist.prototype.getInfoLine1 = function() {
                return this.getSelf()._infoLine1 || ""
            }
            ,
            AudioPlaylist.prototype.getInfoLine2 = function() {
                return this.getSelf()._infoLine2 || ""
            }
            ,
            AudioPlaylist.prototype.getListens = function() {
                return this.getSelf()._listens || 0
            }
            ,
            AudioPlaylist.prototype.getAddClasses = function() {
                return this.getSelf()._addClasses || ""
            }
            ,
            AudioPlaylist.prototype.isOfficial = function() {
                return !!this.getSelf()._isOfficial
            }
            ,
            AudioPlaylist.prototype.getLastUpdated = function() {
                return this.getSelf()._lastUpdated || ""
            }
            ,
            AudioPlaylist.prototype.getEditHash = function() {
                return this.getSelf()._editHash || ""
            }
            ,
            AudioPlaylist.prototype.getCoverUrl = function() {
                return this.getSelf()._coverUrl || ""
            }
            ,
            AudioPlaylist.prototype.getBlocks = function() {
                return this.getSelf()._blocks || {}
            }
            ,
            AudioPlaylist.prototype.isPopBand = function() {
                return !!this.getSelf()._band
            }
            ,
            AudioPlaylist.prototype.getPlaybackParams = function() {
                return this.getSelf()._playbackParams
            }
            ,
            AudioPlaylist.prototype.setPlaybackParams = function(t) {
                var e = this.getSelf();
                e._playbackParams = t
            }
            ,
            AudioPlaylist.prototype.hasMore = function() {
                return !!this.getSelf()._hasMore
            }
            ,
            AudioPlaylist.prototype.getFeedFrom = function() {
                return this.getSelf()._feedFrom
            }
            ,
            AudioPlaylist.prototype.getFeedOffset = function() {
                return this.getSelf()._feedOffset
            }
            ,
            AudioPlaylist.prototype.getSearchParams = function() {
                return this.getSelf()._searchParams || null
            }
            ,
            AudioPlaylist.prototype.getLocalFoundCount = function() {
                return this.getSelf()._localFoundTotal || 0
            }
            ,
            AudioPlaylist.prototype.setLocalFoundCount = function(t) {
                var e = this.getSelf();
                e._localFoundTotal = t
            }
            ,
            AudioPlaylist.prototype.getTotalCount = function() {
                return this.getSelf()._totalCount
            }
            ,
            AudioPlaylist.prototype.getTotalCountHash = function() {
                return this.getSelf()._totalCountHash
            }
            ,
            AudioPlaylist.prototype.isShuffled = function() {
                return !!this.getShuffle()
            }
            ,
            AudioPlaylist.prototype.getShuffle = function() {
                return this.getSelf()._shuffle
            }
            ,
            AudioPlaylist.prototype.getFriendId = function() {
                return this.getSelf()._friend
            }
            ,
            AudioPlaylist.prototype.setAdsAllowed = function(t) {
                return this.getSelf()._isAdsAllowed = t
            }
            ,
            AudioPlaylist.prototype.isAdsAllowed = function() {
                return !!this.getSelf()._isAdsAllowed
            }
            ,
            AudioPlaylist.prototype.equals = function(t) {
                return this.getSelf() == t.getSelf()
            }
            ,
            AudioPlaylist.prototype._moveCurrentAudioAtFirstPosition = function() {
                this._unref();
                var t = getAudioPlayer().getCurrentAudio()
                    , e = this.indexOfAudio(t);
                -1 != e && (this._list.splice(e, 1),
                    this._list.unshift(t))
            }
            ,
            AudioPlaylist.prototype.clean = function() {
                this._unref(),
                    this._hasMore = !0,
                    this._list = [],
                    this._items = [],
                    this._feedOffset = this._feedFrom = 0,
                    this._nextOffset = 0
            }
            ,
            AudioPlaylist.prototype.shuffle = function(t) {
                if (this._unref(),
                        this._shuffle = t,
                        this._shuffle)
                    if (this.getType() == AudioPlaylist.TYPE_PLAYLIST)
                        this.hasMore() || (this._originalList = [].concat(this._list),
                            shuffle(this._list),
                            this._moveCurrentAudioAtFirstPosition());
                    else if (this.getType() == AudioPlaylist.TYPE_SEARCH) {
                        if (this.getLocalFoundCount() > 1) {
                            var e = this._list.splice(0, this.getLocalFoundCount());
                            this._originalList = [].concat(e),
                                shuffle(e),
                                this._list = e.concat(this._list)
                        }
                    } else if (this.hasMore()) {
                        var i = getAudioPlayer().getCurrentAudio();
                        this.indexOfAudio(i) >= 0 && (this._audioToFirstPos = i),
                            this.clean()
                    } else
                        this._originalList = [].concat(this._list),
                            shuffle(this._list),
                            this._moveCurrentAudioAtFirstPosition();
                else
                    this.getType() == AudioPlaylist.TYPE_PLAYLIST ? this._originalList && (this._list = this._originalList) : this.getType() == AudioPlaylist.TYPE_SEARCH ? this.getLocalFoundCount() > 1 && (this._list.splice(0, this.getLocalFoundCount()),
                        this._list = (this._originalList || []).concat(this._list)) : this.hasMore() ? this.clean() : this._list = this._originalList,
                        delete this._shuffle,
                        delete this._originalList,
                        delete this._audioToFirstPos;
                return !0
            }
            ,
            AudioPlaylist.prototype.getPlaybackSection = function() {
                var t = this.getPlaybackParams() || {}
                    , e = "other";
                return t.list_owner_id == vk.id ? e = t.album_id == AudioPlaylist.ALBUM_ALL ? "my" : "my_album" : t.is_widget ? e = "widget" : t.is_audio_feed ? e = "audio_feed" : t.is_wiki ? e = "wiki" : t.is_attach ? e = "attaches" : t.is_board ? e = "board" : t.is_friend ? e = "friend" : t.rec ? "all" == t.rec ? e = "recs" : "album" == t.rec ? e = "recs_album" : "audio" == t.rec && (e = "recs_audio") : t.pop_genre ? e = -1 == t.pop_genre ? "pop" : "pop_genre" : t.is_band ? e = "pop_band" : t.is_recent ? e = "recent" : t.is_search ? e = "search" : t.is_global_search ? e = "global_search" : t.is_replies ? e = "replies" : t.is_im ? e = "im" : t.is_feed ? e = "feed" : t.wall ? e = t.wall < 0 ? "group_wall" : "user_wall" : t.status ? e = t.status < 0 ? "group_status" : "user_status" : t.list_owner_id > 0 ? e = "user_list" : t.list_owner_id < 0 && (e = "group_list"),
                    e
            }
            ,
            AudioPlaylist.prototype.isComplete = function() {
                return this.getSelf().getType() == AudioPlaylist.TYPE_ALBUM ? this.getSelf()._isComplete : !0
            }
            ,
            AudioPlaylist.prototype.getNextOffset = function() {
                return this.getSelf()._nextOffset || this.getAudiosCount()
            },
            AudioPlaylist.prototype.getUnshuffledAudiosList = function() {
                var t = this.getSelf()
                    , e = void 0;
                return e = t._originalList ? t._originalList : t._list
            }
            ,
            AudioPlaylist.prototype.getAudiosList = function() {
                return this.getSelf()._list || []
            }
            ,
            AudioPlaylist.prototype.getItemsList = function() {
                return this.getSelf()._items || []
            }
            ,
            AudioPlaylist.prototype.getPostId = function() {
                return this.getSelf()._postId
            }
            ,
            AudioPlaylist.prototype.getWallQuery = function() {
                return this.getSelf()._wallQuery
            }
            ,
            AudioPlaylist.prototype.getWallType = function() {
                return this.getSelf()._wallType
            }
            ,
            AudioPlaylist.prototype.getCommunititesBlock = function() {
                return this.getSelf()._communitiesBlock
            }
            ,
            AudioPlaylist.prototype.getNextAudio = function(t) {
                var e = this.indexOfAudio(t)
                    , i = this.getSelf();
                -1 == e && isNumeric(i._nextAfterRemovedIndex) && (e = Math.max(0, i._nextAfterRemovedIndex - 1),
                    delete i._nextAfterRemovedIndex);
                var o = 1;
                return e >= 0 && e + o < this.getAudiosCount() ? this.getAudioAt(e + o) : !1
            }
        ;
        var AUDIO_LOAD_CHUNK_SIZE = 2e3;
        AudioPlaylist.prototype.isFullyLoadable = function() {
            return this.getType() == AudioPlaylist.TYPE_PLAYLIST
        }
            ,
            AudioPlaylist.prototype.loadAll = function(t) {
                return this.isFullyLoadable() ? void this.load(0, t, !0) : t && t()
            }
            ,
            AudioPlaylist.prototype.load = function(t, e, i) {
                function o(t, e) {
                    var i = this._onDoneLoading;
                    delete this._onDoneLoading,
                        delete this._loadingAll,
                        each(i || [], function(t, i) {
                            i && i(this, e)
                        }
                            .bind(this))
                }
                isFunction(t) && (e = t,
                    t = 0),
                    t = intval(t);
                var a = this.getType() == AudioPlaylist.TYPE_FEED ? this.getItemsCount() : this.getAudiosCount()
                    , s = this.isFullyLoadable() && i && this.hasMore();
                if (a > t && !s)
                    return e && e(this);
                if (!this.hasMore())
                    return e && e(this);
                var r = this.getSearchParams();
                return this.getType() != AudioPlaylist.TYPE_SEARCH || r.globalQuery ? (this._onDoneLoading = this._onDoneLoading || [],
                    this._onDoneLoading.push(e),
                    this._loadingAll ? void 0 : i ? (this._loadingAll = !0,
                        void _loadAllPlaylistAudios(this, o.bind(this))) : void ajax.post("al_audio.php", {
                        act: "load_section",
                        type: this.getType(),
                        owner_id: this.getOwnerId(),
                        playlist_id: this.getPlaylistId(),
                        offset: this.getNextOffset() - this.getLocalFoundCount(),
                        access_hash: this.getAccessHash(),
                        search_q: r ? r.globalQuery : null,
                        search_performer: r ? r.performer : null,
                        search_lyrics: r ? r.lyrics : null,
                        search_sort: r ? r.sort : null,
                        search_history: r ? intval(r.fromHistory) : null,
                        feed_from: this.getFeedFrom(),
                        feed_offset: this.getFeedOffset(),
                        shuffle: this.getShuffle(),
                        post_id: this.getPostId(),
                        wall_query: this.getWallQuery(),
                        wall_type: this.getWallType(),
                        claim: intval(nav.objLoc.claim)
                    }, {
                        onDone: function(t, e, a) {
                            addTemplates({
                                audio_playlist_snippet: e
                            }),
                                extend(cur.lang, a),
                            (!this._loadingAll || i) && (getAudioPlayer().mergePlaylistData(this, t),
                            this._audioToFirstPos && (this.addAudio(this._audioToFirstPos, 0),
                                delete this._audioToFirstPos),
                                o.call(this),
                                getAudioPlayer().saveStateCurrentPlaylist())
                        }
                            .bind(this)
                    })) : e && e(this)
            }
            ,
            AudioPlaylist.prototype.getLiveInfo = function() {
                var t = this.getSelf()._live;
                return t ? (t = t.split(","),
                    {
                        hostId: t[0],
                        audioId: t[1],
                        hash: t[2]
                    }) : !1
            }
            ,
            AudioPlaylist.prototype.isLive = function() {
                return !!this.getLiveInfo()
            }
            ,
            AudioPlaylist.prototype.getAudioAt = function(t) {
                return this.getSelf()._list.length > t ? this.getSelf()._list[t] : null
            }
            ,
            AudioPlaylist.prototype.getAudiosCount = function() {
                return this.getSelf()._list.length
            }
            ,
            AudioPlaylist.prototype.getTotalDuration = function() {
                var t = this.getAudiosList()
                    , e = 0;
                return each(t, function(t, i) {
                    e += i[AudioUtils.AUDIO_ITEM_INDEX_DURATION]
                }),
                    e
            }
            ,
            AudioPlaylist.prototype.getItemsCount = function() {
                var t = this.getSelf();
                return t._items = t._items || [],
                    t._items.length
            }
            ,
            AudioPlaylist.prototype.removeAudio = function(t) {
                var e = this.indexOfAudio(t);
                if (e >= 0) {
                    this._unref();
                    var i = this._list.splice(e, 1);
                    return this._index && this._index.remove(i[0]),
                        e
                }
                return -1
            }
            ,
            AudioPlaylist.prototype.addAudio = function(t, e) {
                function i(t) {
                    var i = o.getUnshuffledAudiosList()
                        , s = o.indexOfAudio(t);
                    if (s >= 0) {
                        if (a)
                            return;
                        i.splice(s, 1)
                    }
                    t = clone(t),
                        t[AudioUtils.AUDIO_ITEM_INDEX_TITLE] = clean(replaceEntities(t[AudioUtils.AUDIO_ITEM_INDEX_TITLE]).replace(/(<em>|<\/em>)/g, "")),
                        t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER] = clean(replaceEntities(t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER]).replace(/(<em>|<\/em>)/g, "")),
                        t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS] &= ~AudioUtils.AUDIO_ITEM_INLINED_BIT,
                        a ? i.push(t) : i.splice(e, 0, t),
                    o._index && o._index.add(t)
                }
                this._unref();
                var o = this
                    , a = void 0 === e;
                if (isArray(t) && isArray(t[0]))
                    for (var s = 0, r = t.length; r > s; s++)
                        i(t[s]);
                else
                    t.length && i(t)
            }
            ,
            AudioPlaylist.prototype.mergeWith = function(t) {
                if (!isObject(this._ref)) {
                    var e = t.list;
                    if (e) {
                        var i = getAudioPlayer().getCurrentAudio();
                        if (i && this.indexOfAudio(i) >= 0) {
                            for (var o = -1, a = 0, s = e.length; s > a; a++)
                                if (i[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] == e[a][AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] && i[AudioUtils.AUDIO_ITEM_INDEX_ID] == e[a][AudioUtils.AUDIO_ITEM_INDEX_ID]) {
                                    o = a;
                                    break
                                }
                            o >= 0 && this.clean()
                        }
                        this.addAudio(t.list)
                    }
                    if (t.items) {
                        this._items = this._items || [];
                        for (var a = 0, s = t.items.length; s > a; a++)
                            this._items.push(t.items[a])
                    }
                    var r = this;
                    each("gridCovers communitiesBlock addClasses nextOffset hasMore followHash accessHash isFollowed rawId title authorLine authorHref authorName infoLine1 infoLine2 isOfficial description lastUpdated listens feedFrom feedOffset live searchParams totalCount totalCountHash postId wallQuery wallType originalList shuffle isAdsAllowed editHash coverUrl".split(" "), function(e, i) {
                        void 0 !== t[i] && (r["_" + i] = t[i])
                    })
                }
            }
            ,
            AudioPlaylist.prototype.moveAudio = function(t, e) {
                this._unref();
                var i = this._list.splice(t, 1);
                e > t && (e -= 1),
                    this._list.splice(e, 0, i[0])
            }
            ,
            AudioPlaylist.prototype.indexOfAudio = function(t) {
                if (!t)
                    return -1;
                var e;
                isString(t) ? e = t.split("_") : isObject(t) ? e = [t.ownerId, t.id] : isArray(t) && (e = [t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID], t[AudioUtils.AUDIO_ITEM_INDEX_ID]]);
                for (var i = this.getSelf(), o = 0, a = i._list.length; a > o; o++)
                    if (e[0] == i._list[o][AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] && e[1] == i._list[o][AudioUtils.AUDIO_ITEM_INDEX_ID])
                        return o;
                return -1
            }
            ,
            AudioPlaylist.prototype.getAudio = function(t) {
                isString(t) ? t : AudioUtils.asObject(t).fullId,
                    t = t.split("_");
                for (var e = this.getSelf(), i = 0, o = e._list.length; o > i; i++)
                    if (t[0] == e._list[i][AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] && t[1] == e._list[i][AudioUtils.AUDIO_ITEM_INDEX_ID])
                        return e._list[i];
                return null
            }
            ,
            AudioPlaylist.prototype._ensureIndex = function(t) {
                var e = this.getSelf();
                if (e._index)
                    t && t();
                else {
                    var i = function(t, e) {
                        var i = intval(e);
                        return i >= 33 && 48 > i ? String.fromCharCode(i) : t
                    };
                    e._index = new vkIndexer(e._list,function(t) {
                            return (t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER] + " " + t[AudioUtils.AUDIO_ITEM_INDEX_TITLE]).replace(/\&\#(\d+);?/gi, i)
                        }
                        ,t)
                }
            }
            ,
            AudioPlaylist.prototype.search = function(t, e) {
                var i = this.getSelf();
                isObject(t) || (t = {
                    q: t
                }),
                    this._ensureIndex(function() {
                        var o = i._index ? i._index.search(t.q) : [];
                        return o = o.filter(function(e) {
                            return t.lyrics ? !!intval(e[AudioUtils.AUDIO_ITEM_INDEX_LYRICS]) : !0
                        }),
                            e(o)
                    }
                        .bind(this))
            }
            ,
            AudioPlaylist.prototype.toString = function() {
                return this.getId()
            }
            ,
            AudioPlaylist.prototype.fetchNextLiveAudio = function(t) {
                var e = this.getLiveInfo()
                    , i = this;
                ajax.post("al_audio.php", {
                    act: "a_get_audio_status",
                    host_id: e.hostId
                }, {
                    onDone: function(e) {
                        if (e) {
                            var o = i.indexOfAudio(e);
                            o >= 0 ? i.moveAudio(o, i.getAudiosCount() - 1) : i.addAudio(e)
                        }
                        t && t(e)
                    }
                })
            }
            ,
        window.AudioPlayer || (window.AudioPlayer = function() {
                if (this._currentAudio = !1,
                        this._isPlaying = !1,
                        this._prevPlaylist = null,
                        this._currentPlaylist = null,
                        this._playlists = [],
                        this.subscribers = [],
                        this._tasks = [],
                        this._playbackSent = !1,
                        this._listened = {},
                        this._statusExport = {},
                        this._currentPlayingRows = [],
                        this._allowPrefetchNext = !1,
                        this.db = openDatabase('MusicBar', '1.0', 'Music Bar database', 4 * 1024 * 1024),
                        !vk.isBanned) {
                    AudioUtils.debugLog("Player creation"),
                        this._initImpl(),
                        this._initEvents(),
                        this._restoreVolumeState();
                    var t = this;
                    setTimeout(function() {
                        t.restoreState(),
                            AudioUtils.toggleAudioHQBodyClass(),
                            t.updateCurrentPlaying()
                    })
                }
            }
        ),
            AudioPlayer.prototype.getVersion = function() {
                return 15
            },

            AudioPlayer.prototype.unmask = function(t) {
                return (0,_audio_unmask_source.audioUnmaskSource)(t)
            },

            AudioPlayer.prototype._initImpl = function(t) {
                var e = this;
                this._impl && this._impl.destroy();
                var i = 0
                    , o = function(t) {
                    if (-1 != i) {
                        if (t && (i++,
                                this._implSetDelay(200),
                            i > 3)) {
                            i = -1;
                            var e = new MessageBox({
                                title: getLang("global_error")
                            }).content(getLang("audio_error_loading")).setButtons("Ok", function() {
                                i = 0,
                                    curBox().hide()
                            });
                            return e.show(),
                                setWorkerTimeout(function() {
                                    i = 0,
                                        e.hide()
                                }, 3e3),
                                this.notify(AudioPlayer.EVENT_ENDED),
                                void this.notify(AudioPlayer.EVENT_FAILED)
                        }
                        this._playbackSent = !1,
                            this._repeatCurrent ? (this._implSeekImmediate(0),
                                this._implPlay()) : (this._isPlaying = !1,
                                this.notify(AudioPlayer.EVENT_PAUSE),
                                this.notify(AudioPlayer.EVENT_ENDED),
                                this.playNext(!0))
                    }
                }
                    .bind(this)
                    , a = 0
                    , s = {
                    onBufferUpdate: function(t) {
                        this.notify(AudioPlayer.EVENT_BUFFERED, t)
                    }
                        .bind(this),
                    onEnd: function() {
                        a = 0,
                            o()
                    },
                    onFail: function() {
                        a = 0,
                            o(!0)
                    },
                    onCanPlay: function() {
                        this.notify(AudioPlayer.EVENT_CAN_PLAY)
                    }
                        .bind(this),
                    onProgressUpdate: function(t, e) {
                        var i = this.getCurrentAudio();
                        !this._muteProgressEvents && i && this.notify(AudioPlayer.EVENT_PROGRESS, t, i[AudioUtils.AUDIO_ITEM_INDEX_DURATION], e)
                    }
                        .bind(this),
                    onFrequency: function(t) {
                        e.notify(AudioPlayer.EVENT_FREQ_UPDATE, t)
                    }
                };
                AudioUtils.debugLog("Implementation init"),
                    AudioUtils.debugLog("param browser.flash", browser.flash),
                    AudioUtils.debugLog("param force HTML5", !!t),
                    t ? this._impl = new AudioPlayerHTML5(s) : AudioPlayerHTML5WebAudio.isSupported() ? this._impl = new AudioPlayerHTML5WebAudio(s) : AudioPlayerHTML5.isSupported() ? this._impl = new AudioPlayerHTML5(s) : browser.flash && (this._impl = new AudioPlayerFlash(s)),
                    this._implSetVolume(0)
            }
            ,
            AudioPlayer.EVENT_CURRENT_CHANGED = "curr",
            AudioPlayer.EVENT_PLAY = "start",
            AudioPlayer.EVENT_PAUSE = "pause",
            AudioPlayer.EVENT_STOP = "stop",
            AudioPlayer.EVENT_UPDATE = "update",
            AudioPlayer.EVENT_LOADED = "loaded",
            AudioPlayer.EVENT_ENDED = "ended",
            AudioPlayer.EVENT_FAILED = "failed",
            AudioPlayer.EVENT_BUFFERED = "buffered",
            AudioPlayer.EVENT_PROGRESS = "progress",
            AudioPlayer.EVENT_VOLUME = "volume",
            AudioPlayer.EVENT_PLAYLIST_CHANGED = "plchange",
            AudioPlayer.EVENT_ADDED = "added",
            AudioPlayer.EVENT_REMOVED = "removed",
            AudioPlayer.EVENT_FREQ_UPDATE = "freq",
            AudioPlayer.EVENT_AD_READY = "ad_ready",
            AudioPlayer.EVENT_AD_DEINITED = "ad_deinit",
            AudioPlayer.EVENT_AD_STARTED = "ad_started",
            AudioPlayer.EVENT_AD_COMPLETED = "ad_completed",
            AudioPlayer.EVENT_START_LOADING = "start_load",
            AudioPlayer.EVENT_CAN_PLAY = "actual_start",
            AudioPlayer.LS_VER = "v20",
            AudioPlayer.LS_KEY_PREFIX = "audio",
            AudioPlayer.LS_PREFIX = AudioPlayer.LS_KEY_PREFIX + "_" + AudioPlayer.LS_VER + "_",
            AudioPlayer.LS_VOLUME = "vol",
            AudioPlayer.LS_PL = "pl",
            AudioPlayer.LS_TRACK = "track",
            AudioPlayer.LS_SAVED = "saved",
            AudioPlayer.LS_PROGRESS = "progress",
            AudioPlayer.LS_DURATION_TYPE = "dur_type",
            AudioPlayer.LS_ADS_CURRENT_DELAY = "ads_current_delay_v4",
            AudioPlayer.PLAYBACK_EVENT_TIME = 10,
            AudioPlayer.LISTENED_EVENT_TIME_COEFF = .6,
            AudioPlayer.DEFAULT_VOLUME = .8,
            AudioPlayer.AD_TYPE = "preroll",
            window.audioIconSuffix = window.devicePixelRatio >= 2 ? "_2x" : "",
            AudioPlayer.tabIcons = {
                def: "/images/icons/favicons/fav_logo" + audioIconSuffix + ".ico",
                play: "/images/icons/favicons/fav_play" + audioIconSuffix + ".ico",
                pause: "/images/icons/favicons/fav_pause" + audioIconSuffix + ".ico"
            },
            AudioPlayer.getLang = function(t) {
                var e = getAudioPlayer();
                return e && e.langs ? e.langs[t] : t
            }
            ,
            AudioPlayer.clearDeprecatedCacheKeys = function() {
                AudioPlayer._iterateCacheKeys(function(t) {
                    return t == AudioPlayer.LS_VER
                })
            }
            ,
            AudioPlayer.clearOutdatedCacheKeys = function() {
                var t = ls.get(AudioPlayer.LS_PREFIX + AudioPlayer.LS_SAVED) || 0
                    , e = 72e5;
                t < vkNow() - e && AudioPlayer._iterateCacheKeys(function(t, e) {
                    return !inArray(e, [AudioPlayer.LS_PL, AudioPlayer.LS_TRACK, AudioPlayer.LS_PROGRESS])
                })
            }
            ,
            AudioPlayer.clearAllCacheKeys = function() {
                AudioPlayer._iterateCacheKeys(function() {
                    return !1
                }),
                    setCookie("remixcurr_audio", "", -1)
            }
            ,
            AudioPlayer._iterateCacheKeys = function(t) {
                for (var e in window.localStorage)
                    if (0 === e.indexOf(AudioPlayer.LS_KEY_PREFIX + "_")) {
                        var i = e.split("_");
                        t(i[1], i[2]) || localStorage.removeItem(e)
                    }
            }
            ,
            AudioPlayer.prototype.onMediaKeyPressedEvent = function(t) {
                var e = this.getCurrentAudio();
                if (this.getCurrentPlaylist(),
                        e)
                    switch (t.keyCode) {
                        case 179:
                            this.isPlaying() ? this.pause() : this.play();
                            break;
                        case 178:
                            this.seek(0),
                                this.pause();
                            break;
                        case 177:
                            this.playPrev();
                            break;
                        case 176:
                            this.playNext()
                    }
            },

            AudioPlayer.prototype.downloadPlaylist = function() {
                var playlist = this.getCurrentPlaylist();
                this._impl.musicBar.downloadPlaylist(playlist);
            },

            AudioPlayer.prototype.deletePlaylist = function(t) {
                for (var e = 0; e < this._playlists.length; e++)
                    this._playlists[e] == t && this._playlists.splice(e, 1)
            }
            ,
            AudioPlayer.prototype.mergePlaylistData = function(t, e) {
                return t.hasMore() ? void each(this._playlists, function(i, o) {
                    o.getId() == t.getId() && o.mergeWith(e)
                }) : t
            }
            ,
            AudioPlayer.prototype.deleteCurrentPlaylist = function() {
                this.stop(),
                    delete this._currentAudio,
                    delete this._currentPlaylist,
                    this.notify(AudioPlayer.EVENT_UPDATE),
                    this.notify(AudioPlayer.EVENT_PLAYLIST_CHANGED),
                    this.updateCurrentPlaying()
            }
            ,
            AudioPlayer.prototype.updateCurrentPlaying = function(t) {

                this._impl.musicBar.initAudioMessageParser();

                // Add Music Bar panel to the page
                if (document.querySelector("#page_body .audio_friends_list_wrap") && !ge("musicBarPanel")) {
                    var panel = ce("div");
                    panel.setAttribute("id", "musicBarPanel");
                    domInsertBefore(panel, geByClass1("audio_friends_search"));

                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', MusicBar.panelHtmlUrl, true);
                    xhr.send(); // (1)
                    xhr.onreadystatechange = function() { // (3)

                        if (xhr.readyState == 4) {
                            panel.innerHTML = xhr.responseText;
                            getAudioPlayer()._impl.musicBar.initPanel();
                        }

                    };
                }


                t = !!t;
                var e = AudioUtils.asObject(this.getCurrentAudio())
                    , i = [];
                if (e) {
                    var o = geByClass("_audio_row_" + e.fullId);
                    i = i.concat([].slice.call(o))
                }
                for (var a = 0, s = this._currentPlayingRows.length; s > a; a++) {
                    var r = this._currentPlayingRows[a];
                    r && !inArray(r, i) && this.toggleCurrentAudioRow(r, !1, t)
                }
                if (e)
                    for (var a = 0, s = i.length; s > a; a++) {
                        var r = i[a];
                        r && this.toggleCurrentAudioRow(r, !0, t)
                    }
                this._currentPlayingRows = i,
                    each(geByClass("_audio_pl"), function() {
                        removeClass(this, "audio_pl__playing")
                    });
                var l = this.isPlaying()
                    , n = this.getCurrentPlaylist();
                if (l && n) {
                    var u;
                    n.getType() == AudioPlaylist.TYPE_PLAYLIST ? u = geByClass("_audio_pl_" + n.getOwnerId() + "_" + n.getPlaylistId()) : n.getType() == AudioPlaylist.TYPE_RECOM && (u = geByClass("_recoms_special_recoms")),
                    u && each(u, function() {
                        addClass(this, "audio_pl__playing")
                    })
                }
            },

            AudioPlayer.prototype.toggleSelect = function(element) {
                var row = domClosest("audio_row", element);
                toggleClass(row, "selected");
                var count = domQuery(".audio_row.selected").length;

                domQuery("#download-panel .count")[0].innerText = count;
            },

            AudioPlayer.prototype.toggleCurrentAudioRow = function(t, e, i) {
                function o() {
                    if (n && (e ? u._addRowPlayer(t, i) : u._removeRowPlayer(t)),
                            e) {
                        var o;
                        !function() {
                            u.on(t, AudioPlayer.EVENT_PLAY, function(e) {
                                AudioUtils.asObject(e).fullId == AudioUtils.getAudioFromEl(t, !0).fullId && (addClass(t, AudioUtils.AUDIO_PLAYING_CLS),
                                s && attr(s, "aria-label", getLang("global_audio_pause")),
                                r && attr(r, "role", "heading"))
                            }),
                                u.on(t, AudioPlayer.EVENT_PROGRESS, function(e, i, o) {
                                    if (!n && u.isAdPlaying())
                                        return void (s && (s.innerHTML = formatTime(AudioUtils.getAudioFromEl(t, !0).duration)));
                                    o = intval(o);
                                    var a;
                                    a = u.getDurationType() ? "-" + formatTime(Math.round(o - i * o)) : formatTime(Math.round(i * o));
                                    var s = geByClass1("audio_duration", t);
                                    s && (s.innerHTML = a)
                                }),
                                u.on(t, [AudioPlayer.EVENT_PAUSE, AudioPlayer.EVENT_ENDED], function(e) {
                                    removeClass(t, AudioUtils.AUDIO_PLAYING_CLS),
                                    s && attr(s, "aria-label", getLang("global_audio_play")),
                                    r && attr(r, "role", "")
                                });
                            var e = data(t, "bars");
                            e || !function() {
                                e = se('<canvas class="audio_sound_bars"></canvas>');
                                var i = geByClass1("_audio_row_cover_wrap", t);
                                i.appendChild(e),
                                    e.width = AudioUtils.AUDIO_ROW_COVER_SIZE * (isRetina() ? 2 : 1),
                                    e.height = AudioUtils.AUDIO_ROW_COVER_SIZE * (isRetina() ? 2 : 1),
                                    e.style.width = AudioUtils.AUDIO_ROW_COVER_SIZE,
                                    e.style.height = AudioUtils.AUDIO_ROW_COVER_SIZE,
                                isRetina() && (o = e.getContext("2d"),
                                    o.scale(2, 2));
                                var a = !!gpeByClass("audio_numeric", t);
                                u.on(t, AudioPlayer.EVENT_FREQ_UPDATE, function(t, i) {
                                    _updateAudioSoundBars(e, i, a)
                                }),
                                    _updateAudioSoundBars(e, [0, 0, 0, 0], a),
                                    data(t, "bars", e)
                            }(),
                                toggleClass(t, AudioUtils.AUDIO_PLAYING_CLS, u.isPlaying())
                        }()
                    } else {
                        u.off(t),
                            removeClass(t, AudioUtils.AUDIO_PLAYING_CLS),
                        l && (l.innerHTML = formatTime(AudioUtils.getAudioFromEl(t, !0).duration)),
                        s && attr(s, "aria-label", getLang("global_audio_play")),
                        r && attr(r, "role", "");
                        var a = data(t, "bars");
                        a && (re(a),
                            data(t, "bars", null))
                    }
                    i ? setTimeout(function() {
                        var e = intval(domData(t, "is-current"));
                        toggleClass(t, AudioUtils.AUDIO_CURRENT_CLS, !!e)
                    }) : toggleClass(t, AudioUtils.AUDIO_CURRENT_CLS, e)
                }
                var a = !!intval(domData(t, "is-current"));
                if (a != e) {
                    domData(t, "is-current", intval(e));
                    var s = geByClass1("_audio_play", t)
                        , r = geByClass1("_audio_title", t)
                        , l = geByClass1("audio_duration", t)
                        , n = hasClass(t, "inlined");
                    n && toggleClass(t, "audio_with_transition", i),
                        i = n ? i : !1;
                    var u = this;
                    i ? setTimeout(o) : o()
                }
            }
            ,
            AudioPlayer.prototype._removeRowPlayer = function(t) {
                removeClass(t, AudioUtils.AUDIO_CURRENT_CLS);
                var e = data(t, "player_inited");
                if (e) {
                    setTimeout(function() {
                        re(geByClass1("_audio_inline_player", t))
                    }, 200);
                    var i = geByClass1("_audio_duration", t);
                    i && (i.innerHTML = formatTime(AudioUtils.getAudioFromEl(t, !0).duration)),
                        this.off(t),
                        each(e.sliders, function() {
                            this.destroy()
                        }),
                        data(t, "player_inited", !1)
                }
            }
            ,
            AudioPlayer.prototype._addRowPlayer = function(t, e) {
                if (!geByClass1("_audio_inline_player", t)) {
                    var i = this
                        , o = se(vk.audioInlinePlayerTpl || getTemplate("audio_inline_player"))
                        , a = geByClass1("_audio_player_wrap", t);
                    a.appendChild(o);
                    var s = new Slider(geByClass1("audio_inline_player_volume", o),{
                        value: i.getVolume(),
                        backValue: 0,
                        size: 1,
                        hintClass: "audio_player_hint",
                        withBackLine: !0,
                        log: !0,
                        formatHint: function(t) {
                            return Math.round(100 * t) + "%"
                        },
                        onChange: function(t) {
                            i.setVolume(t)
                        }
                    })
                        , r = new Slider(geByClass1("audio_inline_player_progress", o),{
                        value: 0,
                        backValue: 0,
                        size: 1,
                        hintClass: "audio_player_hint",
                        withBackLine: !0,
                        formatHint: function(t) {
                            var e = AudioUtils.asObject(i.getCurrentAudio());
                            return formatTime(Math.round(t * e.duration))
                        },
                        onEndDragging: function(t) {
                            i.seek(t)
                        }
                    });
                    i.isAdPlaying() && r.toggleAdState(!0),
                        i.on(t, AudioPlayer.EVENT_AD_DEINITED, function() {}),
                        i.on(t, AudioPlayer.EVENT_AD_READY, function() {}),
                        i.on(t, AudioPlayer.EVENT_AD_STARTED, function() {
                            r.toggleAdState(!0),
                                r.setBackValue(0)
                        }),
                        i.on(t, AudioPlayer.EVENT_AD_COMPLETED, function() {
                            r.toggleAdState(!1)
                        }),
                        i.on(t, AudioPlayer.EVENT_START_LOADING, function() {
                            r.toggleLoading(!0)
                        }),
                        i.on(t, AudioPlayer.EVENT_CAN_PLAY, function() {
                            r.toggleLoading(!1)
                        }),
                        i.on(t, AudioPlayer.EVENT_BUFFERED, function(t, e) {
                            r.setBackValue(e)
                        }),
                        i.on(t, AudioPlayer.EVENT_PROGRESS, function(t, e) {
                            r.toggleLoading(!1),
                                r.setValue(e)
                        }),
                        i.on(t, AudioPlayer.EVENT_VOLUME, function(t, e) {
                            s.setValue(e)
                        }),
                        data(t, "player_inited", {
                            sliders: [s, r]
                        })
                }
            }
            ,
            AudioPlayer.prototype.shareMusic = function() {
                var t = this.getCurrentAudio();
                return t ? (t = AudioUtils.asObject(t),
                    !showBox("like.php", {
                        act: "publish_box",
                        object: "audio" + t.fullId,
                        list: "s" + vk.id,
                        to: "mail"
                    }, {
                        stat: ["page.js", "page.css", "wide_dd.js", "wide_dd.css", "sharebox.js"],
                        onFail: function(t) {
                            return showDoneBox(t),
                                !0
                        }
                    })) : void 0
            }
            ,
            AudioPlayer.prototype.hasStatusExport = function() {
                for (var t in this._statusExport)
                    if (this._statusExport[t])
                        return !0;
                return !1
            }
            ,
            AudioPlayer.prototype.getStatusExportInfo = function() {
                return this._statusExport
            }
            ,
            AudioPlayer.prototype.setStatusExportInfo = function(t) {
                this._statusExport = t
            }
            ,
            AudioPlayer.prototype.deleteAudioFromAllPlaylists = function(t) {
                t = isObject(t) || isArray(t) ? AudioUtils.asObject(t).fullId : t,
                    each(this._playlists, function(e, i) {
                        i.removeAudio(t)
                    })
            }
            ,
            AudioPlayer.prototype.updateAudio = function(t, e) {
                var i = "";
                if (isString(t) ? i = t : isArray(t) && (i = AudioUtils.asObject(t).fullId),
                    e || (e = t),
                        each(this._playlists, function(t, o) {
                            for (var a = o.getAudiosList(), s = 0, r = a.length; r > s; s++)
                                if (a[s][AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + a[s][AudioUtils.AUDIO_ITEM_INDEX_ID] == i)
                                    return isObject(e) && each(e, function(t, e) {
                                        a[s][t] = e
                                    }),
                                        void (isArray(e) && (a[s] = e))
                        }),
                    this._currentAudio[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + this._currentAudio[AudioUtils.AUDIO_ITEM_INDEX_ID] == i) {
                    if (isObject(e)) {
                        var o = this;
                        each(e, function(t, e) {
                            o._currentAudio[t] = e
                        })
                    }
                    isArray(e) && (this._currentAudio = e)
                }
                return this.notify(AudioPlayer.EVENT_UPDATE),
                    t
            }
            ,
            AudioPlayer.prototype._triggerTNSPixel = function() {
                var t = this._lsGet("tns_triggered_time") || 0;
                this._lsSet("tns_triggered_time", vkNow());
                var e = 18e6;
                vkNow() - t > e || (vkImage().src = "//www.tns-counter.ru/V13a****digitalaudio_ru/ru/UTF-8/tmsec=digitalaudio_total/" + irand(1, 1e9))
            }
            ,
            AudioPlayer.prototype._sendLCNotification = function() {
                var t = window.Notifier;
                t && t.lcSend("audio_start");
                try {
                    window.Videoview && Videoview.togglePlay(!1)
                } catch (e) {}
            }
            ,
            AudioPlayer.prototype.showHQLabel = function(t) {
                var e = "_audio_show_hq_label";
                return void 0 === t ? !!ls.get(e) : (t = !!t,
                    ls.set(e, t),
                    AudioUtils.toggleAudioHQBodyClass(),
                    t)
            }
            ,
            AudioPlayer.prototype._restoreVolumeState = function() {
                AudioPlayer.clearDeprecatedCacheKeys(),
                    AudioPlayer.clearOutdatedCacheKeys();
                var t = this._lsGet(AudioPlayer.LS_VOLUME);
                this._userVolume = void 0 == t || t === !1 ? AudioPlayer.DEFAULT_VOLUME : t
            }
            ,
            AudioPlayer.prototype.restoreState = function() {
                if (!vk.widget) {
                    AudioPlayer.clearDeprecatedCacheKeys(),
                        AudioPlayer.clearOutdatedCacheKeys(),
                        this._currentAudio = this._lsGet(AudioPlayer.LS_TRACK);
                    var t = this._lsGet(AudioPlayer.LS_PL);
                    t && (t = JSON.parse(t),
                        this._currentPlaylist = new AudioPlaylist(t)),
                        this._currentPlaylist && this._currentAudio ? this.notify(AudioPlayer.EVENT_UPDATE) : this._currentPlaylist = this._currentAudio = !1;
                    var e = this._lsGet(AudioPlayer.LS_PROGRESS) || 0;
                    this._currentAudio && e && this._impl && 0 === this._impl.type.indexOf("html5") && (this._implSetUrl(this._currentAudio, !0),
                    1 > e && this._implSeek(e),
                        this._implSetVolume(0))
                }
            }
            ,
            AudioPlayer.prototype._ensureImplReady = function(t) {
                var e = this;
                this._impl && this._impl.onReady(function(i) {
                    return i ? t() : void ("flash" == e._impl.type && (AudioUtils.debugLog("Flash not initialized, lets try HTML5 as desperate way"),
                        e._initImpl(!0)))
                })
            }
            ,
            AudioPlayer.prototype._implNewTask = function(t, e) {
                this._taskIDCounter = this._taskIDCounter || 1,
                    this._tasks = this._tasks || [],
                    this._tasks.push({
                        name: t,
                        cb: e,
                        id: t + "_" + this._taskIDCounter++
                    }),
                    this._implDoTasks()
            }
            ,
            AudioPlayer.prototype._implDoTasks = function() {
                if (this._tasks = this._tasks || [],
                        !this._taskInProgress) {
                    var t = this._tasks.shift();
                    if (t) {
                        var e = this;
                        t = clone(t),
                            this._taskInProgress = t.id,
                            this._ensureImplReady(function() {
                                t.cb.call(e, function() {
                                    return e._taskAbort == t.id ? void (e._taskAbort = !1) : (e._taskInProgress = !1,
                                        void e._implDoTasks())
                                })
                            })
                    }
                }
            }
            ,
            AudioPlayer.prototype._implClearAllTasks = function() {
                this._taskAbort = this._taskInProgress,
                    this._taskInProgress = !1,
                    this._tasks = []
            }
            ,
            AudioPlayer.prototype._implClearTask = function(t) {
                this._tasks = this._tasks || [],
                    this._tasks = this._tasks.filter(function(e) {
                        return e.name != t
                    })
            }
            ,
            AudioPlayer.prototype._implSetDelay = function(t) {
                this._implNewTask("delay", function e(t) {
                    setWorkerTimeout(t, e)
                })
            }
            ,
            AudioPlayer.prototype._implPlay = function() {
                var t = this;
                this._implNewTask("play", function(e) {
                    var i = AudioUtils.asObject(t.getCurrentAudio());
                    t._impl.play(i.url),
                        t._muteProgressEvents = !1,
                        t._allowPrefetchNext = !0,
                        e()
                })
            }
            ,
            AudioPlayer.prototype._implSeekImmediate = function(t) {
                this._impl && this._impl.seek(t)
            }
            ,
            AudioPlayer.prototype._implSeek = function(t) {
                var e = this;
                this._implClearTask("seek"),
                    this._implNewTask("seek", function(i) {
                        e._impl.seek(t),
                            i()
                    })
            }
            ,
            AudioPlayer.prototype._implPause = function() {
                var t = this;
                this._implNewTask("pause", function(e) {
                    t._impl.pause(),
                        e()
                })
            }
            ,
            AudioPlayer.prototype._implSetVolume = function(t, e) {
                if (this._impl) {
                    var i = this;
                    if (e) {
                        var o = 0 == t ? "vol_down" : "vol_up";
                        this._implNewTask(o, function(e) {
                            i._impl.fadeVolume(t, function() {
                                e()
                            })
                        })
                    } else
                        this._implNewTask("vol_set", function(e) {
                            i._impl.setVolume(t),
                                e()
                        })
                }
            }
            ,
            AudioPlayer.prototype._implSetUrl = function(t, e) {
                var i = this;
                this._implClearTask("url"),
                    this._implNewTask("url", function(o) {
                        e || i.notify(AudioPlayer.EVENT_START_LOADING);
                        var a = i._taskInProgress;
                        i._ensureHasURL(t, function(t) {
                            a == i._taskInProgress && (t = AudioUtils.asObject(t),
                                i._impl.setUrl(t.url, function(t) {
                                    t || (i._implClearAllTasks(),
                                        i._onFailedUrl()),
                                        o()
                                }))
                        })
                    })
            }
            ,
            AudioPlayer.prototype.toggleDurationType = function() {
                var t = intval(ls.get(AudioPlayer.LS_PREFIX + AudioPlayer.LS_DURATION_TYPE));
                t = !t,
                    ls.set(AudioPlayer.LS_PREFIX + AudioPlayer.LS_DURATION_TYPE, t),
                    this.notify(AudioPlayer.EVENT_UPDATE, this.getCurrentProgress())
            }
            ,
            AudioPlayer.prototype.getDurationType = function() {
                return intval(ls.get(AudioPlayer.LS_PREFIX + AudioPlayer.LS_DURATION_TYPE))
            }
            ,
            AudioPlayer.prototype.getCurrentProgress = function() {
                return this._impl ? this._impl.getCurrentProgress() : 0
            }
            ,
            AudioPlayer.prototype.getCurrentBuffered = function() {
                return this._impl ? this._impl.getCurrentBuffered() : 0
            }
            ,
            AudioPlayer.prototype._initEvents = function() {
                var t = window.Notifier
                    , e = this;
                t && (t.addRecvClbk("audio_start", "audio", function(t) {
                    e.isPlaying() && e.pause(!1, !e._fadeVolumeWorker),
                        delete e.pausedByVideo
                }),
                    t.addRecvClbk("video_start", "audio", function(t) {
                        e.isPlaying() && (e.pause(),
                            e.pausedByVideo = vkNow())
                    }),
                    t.addRecvClbk("video_hide", "audio", function(t) {
                        !e.isPlaying() && e.pausedByVideo && (vkNow() - e.pausedByVideo < 18e4 && e.play(),
                            delete e.pausedByVideo)
                    }),
                    t.addRecvClbk("logged_off", "audio", function() {
                        cur.loggingOff = !0,
                            AudioPlayer.clearAllCacheKeys(),
                            e.stop()
                    }))
            }
            ,
            AudioPlayer.prototype.addPlaylist = function(t) {
                this.hasPlaylist(t.getId()) || this._playlists.push(t)
            }
        ,
        AudioPlayer.prototype._cleanUpPlaylists = function() {
            for (var t = 0, e = -1, i = this._playlists.length - 1; i >= 0; i--) {
                var o = this._playlists[i];
                if (!o.isReference() && (t += o.getAudiosCount(),
                    t > 4e3)) {
                    e = i;
                    break
                }
            }
            if (-1 != e) {
                e += 1;
                for (var a = this._playlists.slice(0, e), s = this.getCurrentPlaylist(), r = [], i = 0; i < a.length; i++) {
                    var l = a[i];
                    if (s == l && (l = !1),
                        l && !l.isReference())
                        for (var n = e; n < this._playlists.length; n++) {
                            var o = this._playlists[n];
                            o.isReference() && o.getSelf() == l && (l = !1)
                        }
                    l && r.push(i)
                }
                for (var i = 0; i < r.length; i++) {
                    var e = r[i];
                    this._playlists.splice(e, 1)
                }
                r.length && debugLog("AudioPlayer - " + r.length + " playlists removed")
            }
        }
        ,
        AudioPlayer.prototype.hasPlaylist = function(t, e, i) {
            var o;
            o = void 0 !== e && void 0 !== i ? t + "_" + e + "_" + i : t;
            for (var a = 0; a < this._playlists.length; a++) {
                var s = this._playlists[a];
                if (!s.isReference() && s.getId() == o)
                    return s
            }
            return !1
        }
        ,
        AudioPlayer.prototype.getPlaylist = function(t, e, i, o) {
            if (t && !e && !i) {
                var a = t.split("_");
                t = a[0],
                    e = a[1],
                    i = a[2]
            }
            i = void 0 === i ? AudioPlaylist.ALBUM_ALL : i;
            var s = this.hasPlaylist(t, e, i);
            if (s)
                return s.mergeWith({
                    accessHash: o
                }),
                    s;
            if (t == AudioPlaylist.TYPE_ALBUM && i != AudioPlaylist.ALBUM_ALL) {
                var r = this.getPlaylist(AudioPlaylist.TYPE_ALBUM, e, AudioPlaylist.ALBUM_ALL);
                if (!r.hasMore() && r.isComplete()) {
                    var l = new AudioPlaylist(AudioPlaylist.TYPE_ALBUM,e,i);
                    return each(r.getAudiosList(), function(t, e) {
                        e[AudioUtils.AUDIO_ITEM_INDEX_ALBUM_ID] == i && l.addAudio(e)
                    }),
                        l
                }
            }
            return new AudioPlaylist({
                type: t,
                ownerId: e,
                albumId: i,
                hasMore: t != AudioPlaylist.TYPE_TEMP,
                accessHash: o
            })
        }
        ,
        AudioPlayer.prototype.toggleRepeatCurrentAudio = function() {
            this._repeatCurrent = !this._repeatCurrent
        }
        ,
        AudioPlayer.prototype.isRepeatCurrentAudio = function() {
            return !!this._repeatCurrent
        }
        ,
        AudioPlayer.prototype.setNext = function(t, e) {
            if (vk && vk.widget && !vk.id && window.Widgets)
                return Widgets.oauth(),
                    !1;
            var i = domClosest("_audio_row", t)
                , o = AudioUtils.getAudioFromEl(i)
                , a = AudioUtils.asObject(o);
            if (!hasClass(i, "audio_added_next")) {
                addClass(i, "audio_added_next");
                var s = this.getCurrentPlaylist();
                if (s) {
                    var r = AudioUtils.asObject(this.getCurrentAudio());
                    if (r && a.fullId == r.fullId)
                        return;
                    var l = s.indexOfAudio(r);
                    if (-1 == l)
                        return;
                    var n = s.indexOfAudio(a);
                    -1 != n ? s.moveAudio(n, l + 1) : s.addAudio(o, l + 1)
                } else
                    s = AudioUtils.getContextPlaylist(i),
                        this.play(o, s);
                var u = window.AudioPage && currentAudioPage(i);
                if (u) {
                    var d = u.getPageCurrentPlaylist();
                    u.onUserAction(a, d)
                }
            }
            return cancelEvent(e)
        }
        ,
        AudioPlayer.prototype._setTabIcon = function(t) {
            setFavIcon(AudioPlayer.tabIcons[t])
        }
        ,
        AudioPlayer.prototype.on = function(t, e, i) {
            isArray(e) || (e = [e]),
                each(e, function(e, o) {
                    this.subscribers.push({
                        context: t,
                        et: o,
                        cb: i
                    })
                }
                    .bind(this))
        }
        ,
        AudioPlayer.prototype.off = function(t) {
            this.subscribers = this.subscribers.filter(function(e) {
                return e.context != t
            })
        }
        ,
        AudioPlayer.prototype.notify = function(t, e, i, o) {
            var a = this.getCurrentAudio();
            if (this._impl && (this.isAdPlaying() || !this._muteProgressEvents || !inArray(t, [AudioPlayer.EVENT_BUFFERED, AudioPlayer.EVENT_PROGRESS])))
                switch (inArray(t, [AudioPlayer.EVENT_PLAY, AudioPlayer.EVENT_PAUSE]) && (this.subscribers = this.subscribers.filter(function(t) {
                    return t.context instanceof Element ? bodyNode.contains(t.context) : !0
                }),
                    this.updateCurrentPlaying(!0)),
                    each(this.subscribers || [], function(o, s) {
                        s.et == t && s.cb(a, e, i)
                    }),
                    t) {
                    case AudioPlayer.EVENT_VOLUME:
                        this._lsSet(AudioPlayer.LS_VOLUME, this._userVolume);
                        break;
                    case AudioPlayer.EVENT_PLAY:
                        this.saveStateCurrentPlaylist(),
                            this._saveStateCurrentAudio(),
                            this._setTabIcon("play"),
                            this._sendStatusExport();
                        break;
                    case AudioPlayer.EVENT_PLAYLIST_CHANGED:
                        this.saveStateCurrentPlaylist(),
                            this._saveStateCurrentAudio();
                        break;
                    case AudioPlayer.EVENT_PROGRESS:
                        if (!vk.widget && !this._adsIsAdPlaying()) {
                            var s = this.getCurrentPlaylist()
                                , r = this._impl.getCurrentProgress();
                            this._lsSet(AudioPlayer.LS_PROGRESS, r);
                            var l = o;
                            if (l) {
                                var n = a[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + a[AudioUtils.AUDIO_ITEM_INDEX_ID];
                                !this._playbackSent && l >= AudioPlayer.PLAYBACK_EVENT_TIME && (this._sendPlayback(),
                                    this._playbackSent = !0)
                            }
                            if (this._allowPrefetchNext && r >= .8) {
                                var u = s.getNextAudio(a);
                                u && this._impl.isFullyLoaded() && (this._allowPrefetchNext = !1,
                                    this._prefetchAudio(u))
                            }
                            !this._listened[n] && (l / a[AudioUtils.AUDIO_ITEM_INDEX_DURATION] >= AudioPlayer.LISTENED_EVENT_TIME_COEFF || l > 180) && (this._sendListenedEvent(a, s.getType() == AudioPlaylist.TYPE_RECENT),
                                this._listened[n] = !0)
                        }
                        break;
                    case AudioPlayer.EVENT_PAUSE:
                        this._setTabIcon("pause");
                        break;
                    case AudioPlayer.EVENT_ENDED:
                        this._lastTrackEnded = !0
                }
        }
        ,
        AudioPlayer.prototype._sendListenedEvent = function(t, e) {
            var i = AudioUtils.asObject(t);
            ajax.post("al_audio.php", {
                act: "listened",
                audio_owner_id: i.ownerId,
                audio_id: i.id,
                listened: intval(e),
                hash: i.actionHash
            }),
            e || (e = this.getPlaylist(AudioPlaylist.TYPE_RECENT, vk.id),
                t = clone(t),
                t[AudioUtils.AUDIO_ITEM_INDEX_FLAGS] &= ~AudioUtils.AUDIO_ITEM_RECOMS_BIT,
                e.addAudio(t, 0))
        }
        ,
        AudioPlayer.prototype._initPlaybackParams = function(t) {
            if (void 0 === t.getPlaybackParams()) {
                var e = t.getAlbumId()
                    , i = {};
                if (t.getType() == AudioPlaylist.TYPE_ALBUM && (i.list_owner_id = t.getOwnerId(),
                        i.album_id = t.getAlbumId(),
                    t.getFriendId() && (i.is_friend = 1),
                    t.isPopBand() && (i.is_band = 1)),
                    t.getType() == AudioPlaylist.TYPE_FEED && (i.is_audio_feed = 1),
                    t.getType() == AudioPlaylist.TYPE_RECENT && (i.is_recent = 1),
                    t.getType() == AudioPlaylist.TYPE_SEARCH && (i.is_search = 1),
                    t.getType() == AudioPlaylist.TYPE_RECOM) {
                    var o = t.getAlbumId();
                    0 == o ? i.rec = "all" : 0 == o.indexOf("album") ? i.rec = "album" : i.rec = "audio"
                }
                t.getType() == AudioPlaylist.TYPE_POPULAR && (i.pop_genre = (t.getAlbumId() || "").replace("foreign", ""),
                    i.pop_genre = 0 == i.pop_genre ? -1 : i.pop_genre),
                t.getType() == AudioPlaylist.TYPE_TEMP && ("search" == cur.module && (i.is_global_search = 1),
                isString(e) && (0 === e.indexOf("im") ? i.is_im = 1 : 0 === e.indexOf("feed") ? i.is_feed = 1 : 0 === e.indexOf("board") ? i.is_board = 1 : 0 === e.indexOf("wiki") ? i.is_wiki = 1 : 0 === e.indexOf("choose") ? i.is_attach = 1 : 0 === e.indexOf("widget") && (i.is_widget = 1))),
                t.getType() == AudioPlaylist.TYPE_WALL && (isString(e) && 0 === e.indexOf("reply") ? i.is_replies = 1 : isString(e) && 0 === e.indexOf("post") ? i.wall = t.getOwnerId() : i.wall = t.getOwnerId());
                var a = t.getLiveInfo();
                a && (i.status = a.hostId),
                    t.setPlaybackParams(i)
            }
        }
        ,
        AudioPlayer.prototype.playLive = function(t, e) {
            var i = this.getPlaylist(AudioPlaylist.TYPE_LIVE, vk.id, data[0]);
            i.mergeWith({
                live: t,
                hasMore: !1
            }),
                t = i.getLiveInfo();
            var o = this;
            ajax.post("al_audio.php", {
                act: "a_play_audio_status",
                audio_id: t.audioId,
                host_id: t.hostId,
                hash: t.hash
            }, extend(e, {
                onDone: function(t, e) {
                    i.mergeWith({
                        title: e.title,
                        list: [t]
                    }),
                        o.play(t, i)
                }
            }))
        }
        ,
        AudioPlayer.prototype._sendStatusExport = function() {
            var t = this.getCurrentAudio();
            if (t) {
                t = AudioUtils.asObject(t);
                var e = this.statusSent ? this.statusSent.split(",") : [!1, 0]
                    , i = vkNow() - intval(e[1]);
                if (this.hasStatusExport() && (t.id != e[0] || i > 3e5)) {
                    var o = this.getCurrentPlaylist()
                        , a = o ? o.playbackParams : null;
                    setTimeout(ajax.post.pbind("al_audio.php", {
                        act: "audio_status",
                        full_id: t.fullId,
                        hash: vk.statusExportHash,
                        top: intval(a && (a.top_audio || a.top))
                    }), 0),
                        this.statusSent = t.id + "," + vkNow()
                }
            }
        }
        ,
        AudioPlayer.prototype._sendPlayback = function() {
            var t = this.getCurrentPlaylist()
                , e = AudioUtils.asObject(this.getCurrentAudio())
                , i = extend({
                act: "playback",
                audio_id: e.id,
                audio_owner_id: e.ownerId,
                hash: e.actionHash,
                impl: this._impl.type,
                v: this.getVersion()
            }, t.getPlaybackParams() || {
                    other: 1
                });
            i.section = t.getPlaybackSection(),
            cur.audioLoadTimings && (i.timings = cur.audioLoadTimings.join(","),
                cur.audioLoadTimings = []),
            this._lastTrackEnded && (i.last_ended = 1,
                delete this._lastTrackEnded),
                ajax.post("al_audio.php", i, {
                    onDone: function(t) {
                        this._adsConfig = t
                    }
                        .bind(this)
                }),
                stManager.add("audioplayer.js")
        }
        ,
        AudioPlayer.prototype.saveStateCurrentPlaylist = function() {
            if (!vk.widget) {
                var t = this.getCurrentPlaylist();
                if (t) {
                    var e = t.serialize();
                    this._lsSet(AudioPlayer.LS_PL, e)
                } else
                    this._lsSet(AudioPlayer.LS_PL, null);
                this._lsSet(AudioPlayer.LS_SAVED, vkNow())
            }
        }
        ,
        AudioPlayer.prototype._saveStateCurrentAudio = function() {
            if (!vk.widget) {
                var t = this.getCurrentAudio();
                if (t) {
                    var e = clone(t);
                    e[AudioUtils.AUDIO_ITEM_INDEX_URL] = "",
                        this._lsSet(AudioPlayer.LS_TRACK, e),
                        setCookie("remixcurr_audio", t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + t[AudioUtils.AUDIO_ITEM_INDEX_ID], 1)
                } else
                    this._lsSet(AudioPlayer.LS_TRACK, null),
                        setCookie("remixcurr_audio", null, 1)
            }
        }
        ,
        AudioPlayer.prototype.seekCurrentAudio = function(t) {
            if (this._adsIsAdPlaying())
                return !1;
            var e = AudioUtils.asObject(this.getCurrentAudio())
                , i = 10 / e.duration
                , o = this.getCurrentProgress() + (t ? i : -i);
            o = Math.max(0, Math.min(1, o)),
                this.seek(o)
        }
        ,
        AudioPlayer.prototype._lsGet = function(t) {
            return ls.get(AudioPlayer.LS_PREFIX + t)
        }
        ,
        AudioPlayer.prototype._lsSet = function(t, e) {
            ls.set(AudioPlayer.LS_PREFIX + t, e)
        }
        ,
        AudioPlayer.prototype.setVolume = function(t) {
            t = Math.min(1, Math.max(0, t)),
                this._userVolume = t,
                this._implSetVolume(t),
                this._adsUpdateVolume(),
                this.notify(AudioPlayer.EVENT_VOLUME, t)
        }
        ,
        AudioPlayer.prototype.getVolume = function() {
            return void 0 === this._userVolume ? .8 : this._userVolume
        }
        ,
        AudioPlayer.prototype.seek = function(t) {
            this._implSeekImmediate(t)
        }
        ,
        AudioPlayer.prototype._ensureHasURL = function(t, e) {
            var i = [];
            this._currentUrlEnsure = this._currentUrlEnsure || {};
            var o = AudioUtils.asObject(t);
            if (o.url)
                return e && e(t);
            var a = this.getCurrentPlaylist()
                , s = a.indexOfAudio(t);
            if (s >= 0)
                for (var r = s; s + 5 > r; r++) {
                    var l = AudioUtils.asObject(a.getAudioAt(r));
                    !l || l.url || this._currentUrlEnsure[l.fullId] || (i.push(l.fullId),
                        this._currentUrlEnsure[l.fullId] = !0)
                }
            if (i.push(o.fullId),
                    i.length) {
                var n = this;
                ajax.post("al_audio.php", {
                    act: "reload_audio",
                    ids: i.join(",")
                }, {
                    onDone: function(i, a) {

                        if (typeof (a) === "undefined") {

                            if (u._impl.musicBar.params.bitrate) {

                                var modal = showFastBox({
                                    title: "??????",
                                    dark: 1
                                }, "? ?????????, ?????? ???????? ??????????. ?? ?????? ????????? ??????????? ???????? ????? ??? ????????? ???????? ????????.", "???????", function(a) {
                                    modal.hide();
                                }, '????????? ???????', function() {
                                    AudioUtils.toggleAudioHQBodyClass(0);
                                    modal.hide();
                                })
                            } else {
                                var modal = showFastBox({
                                    title: "??????",
                                    dark: 1
                                }, "? ?????????, ?????? ???????? ??????????. ?????????? ????????? ???????? ???? ?????.", "???????", function(a) {
                                    modal.hide();
                                })
                            }

                            return false;
                        }

                        getAudioPlayer().setStatusExportInfo(a),
                            each(i, function(e, i) {
                                i = AudioUtils.asObject(i);
                                var a = {};
                                a[AudioUtils.AUDIO_ITEM_INDEX_URL] = i.url,
                                    n.updateAudio(i.fullId, a),
                                o.fullId == i.fullId && (t[AudioUtils.AUDIO_ITEM_INDEX_URL] = i.url),
                                n.currentAudio && AudtioUtils.asObject(n.currentAudio).fullId == i.fullId && (n.currentAudio[AudioUtils.AUDIO_ITEM_INDEX_URL] = i.url),
                                    delete n._currentUrlEnsure[i.fullId]
                            }),
                        e && e(t)
                    }
                })
            }
        }
        ,
        AudioPlayer.prototype.toggleAudio = function(t, e) {
            if (vk && vk.widget && !vk.id && window.Widgets)
                return Widgets.oauth(),
                    !1;
            var i = domClosest("_audio_row", t);
            if (window.getSelection && window.getSelection().rangeCount) {
                var o = window.getSelection().getRangeAt(0);
                if (o && o.startOffset != o.endOffset)
                    return !1
            }
            if (e && hasClass(e.target, "mem_link"))
                return nav.go(attr(e.target, "href"), e, {
                    navigateToUploader: !0
                }),
                    cancelEvent(e);

            var a = cur.cancelClick  || e && hasClass(e.target, "select-check") || e && hasClass(e.target, "select-check-wrapper") || e && hasClass(e.target, "audio_row_chords_block") || e && (hasClass(e.target, "audio_lyrics") || domClosest("_audio_duration_wrap", e.target) || domClosest("_audio_inline_player", e.target) || domClosest("audio_performer", e.target));


            //var a = cur.cancelClick || e && (hasClass(e.target, "audio_lyrics") || domClosest("_audio_duration_wrap", e.target) || domClosest("_audio_inline_player", e.target) || domClosest("audio_performer", e.target));
            if (cur._sliderMouseUpNowEl && cur._sliderMouseUpNowEl == geByClass1("audio_inline_player_progress", i) && (a = !0),
                    delete cur.cancelClick,
                    delete cur._sliderMouseUpNowEl,
                    a)
                return !0;
            var s = AudioUtils.getAudioFromEl(i, !0);
            if (AudioUtils.isClaimedAudio(s)) {
                var r = AudioUtils.getAudioExtra(s)
                    , l = r.claim;
                if (l)
                    return void showAudioClaimWarning(s.ownerId, s.id, l.id, s.title, l.reason)
            }
            var n = hasClass(i, AudioUtils.AUDIO_PLAYING_CLS);
            if (n)
                this.pause();
            else {
                var u = AudioUtils.getContextPlaylist(i);
                this.play(s.fullId, u),
                cur.audioPage && cur.audioPage.onUserAction(s, u)
            }
        }
        ,
        AudioPlayer.prototype._onFailedUrl = function(t) {
            this.notify(AudioPlayer.EVENT_FAILED),
            this.isPlaying() && (this.pause(),
                this.playNext(!0, !0))
        }
        ,
        AudioPlayer.prototype._startAdsPlay = function(t, e, i, o) {
            function a() {
                var i = e.getPlaybackSection();
                switch (t = AudioUtils.asObject(t),
                    this._adsIsAllowed(t, e)) {
                    case AudioPlayer.ADS_ALLOW_ALLOWED:
                        this._adsFetchAd(t, i, !1, function() {
                            o && o()
                        }
                            .bind(this));
                        break;
                    case AudioPlayer.ADS_ALLOW_DISABLED:
                        o && o();
                        break;
                    case AudioPlayer.ADS_ALLOW_REJECT:
                        this._adsFetchAd(t, i, !0),
                        o && o()
                }
            }
            this._startAdsTO && clearWorkerTimeout(this._startAdsTO),
                i ? this._startAdsTO = setWorkerTimeout(a.bind(this), 200) : a.call(this)
        }
        ,
        AudioPlayer.prototype.playPlaylist = function(t, e, i, o) {
            if (vk && vk.widget && !vk.id && window.Widgets)
                return Widgets.oauth(),
                    !1;
            var a = this.getCurrentPlaylist()
                , s = this.getPlaylist(AudioPlaylist.TYPE_PLAYLIST, t, e, i);
            if (o && s.hasMore() && 0 == s.getAudiosCount()) {
                var r = geByClass1("_audio_row", gpeByClass("_audio_pl", o));
                if (r) {
                    var l = AudioUtils.getAudioFromEl(r);
                    s.mergeWith({
                        list: [l]
                    })
                }
            }
            a && a.getId() == s.getId() && this.isPlaying() ? this.pause() : (s.load(function() {
                var t = s.getAudioAt(0);
                t && this.play(t, s)
            }
                .bind(this)),
            s.getAudiosCount() && this.play(l, s))
        }
        ,
        AudioPlayer.prototype.play = function(t, e, i, o) {
            if (!cur.loggingOff) {
                if (!this._impl)
                    return void AudioUtils.showNeedFlashBox();
                this._cleanUpPlaylists(),
                (isObject(t) || isArray(t)) && (t = AudioUtils.asObject(t),
                t && (t = t.fullId));
                var a = AudioUtils.asObject(this._currentAudio)
                    , s = this.getCurrentPlaylist();
                !t && a && (t = a.fullId);
                var r = !1
                    , l = t && a && t == a.fullId;
                e ? s && (r = e == s.getSelf() || e == s) : (e = s,
                    r = !0);
                var n = e.getAudio(t);
                this._initPlaybackParams(e),
                n && e.load(e.indexOfAudio(n) + 3),
                l || (this._playbackSent = !1),
                l || this._adsIsAdPlaying() || this._adsDeinit(),
                    l && r ? this._adsIsAdPlaying() ? this._adsResumeAd() : this.isPlaying() || (this._isPlaying = !0,
                        this._sendLCNotification(),
                        this.notify(AudioPlayer.EVENT_PLAY),
                    l || this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                        this._implClearAllTasks(),
                        this._implSetVolume(0),
                        this._implSetUrl(n),
                        this._implPlay(),
                        this._implSetVolume(this.getVolume(), !0)) : t && n && (this._currentAudio = n,
                    r || (this._currentPlaylist && (this._prevPlaylist = this._currentPlaylist,
                        this._prevAudio = this._currentAudio),
                        this._currentPlaylist = new AudioPlaylist(e),
                        this.notify(AudioPlayer.EVENT_PLAYLIST_CHANGED)),
                        this._isPlaying = !0,
                        this.updateCurrentPlaying(!0),
                        this._adsIsAdPlaying() ? (this.notify(AudioPlayer.EVENT_PLAY, !0),
                            this._adsResumeAd()) : (this._sendLCNotification(),
                            this.notify(AudioPlayer.EVENT_PLAY, !0, intval(i), o),
                            this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                            this._muteProgressEvents = !0,
                            this._implClearAllTasks(),
                            o ? this._startAdsPlay(n, e, !1, function() {
                                n = this.getCurrentAudio(),
                                n && this.isPlaying() && (this.notify(AudioPlayer.EVENT_UPDATE),
                                    this._implSetUrl(n),
                                    this._implPlay(),
                                    this._implSetVolume(this.getVolume()),
                                    this._triggerTNSPixel())
                            }
                                .bind(this)) : (this._implSetVolume(0, !0),
                                this._implPause(),
                                this._startAdsPlay(n, e, !0, function() {
                                    n = this.getCurrentAudio(),
                                    n && this.isPlaying() && (this.notify(AudioPlayer.EVENT_UPDATE),
                                        this._implSetUrl(n),
                                        this._implPlay(),
                                        this._implSetVolume(this.getVolume()),
                                        this._triggerTNSPixel())
                                }
                                    .bind(this)))))
            }
        }
        ,
        AudioPlayer.prototype._prefetchAudio = function(t) {
            t = AudioUtils.asObject(t),
            t && t.url && this._impl.prefetch && this._impl.prefetch(t.url)
        }
        ,
        AudioPlayer.prototype.getCurrentPlaylist = function() {
            return this._currentPlaylist
        }
        ,
        AudioPlayer.prototype.getPlaylists = function() {
            return clone(this._playlists)
        }
        ,
        AudioPlayer.prototype.pause = function() {
            this._adsIsAdPlaying() && this._adsPauseAd(),
                this._isPlaying = !1,
                this.notify(AudioPlayer.EVENT_PAUSE),
                this._implSetVolume(0, !0),
                this._implPause()
        }
        ,
        AudioPlayer.prototype.stop = function() {
            this._isPlaying = !1,
                this._impl.stop(),
                this.notify(AudioPlayer.EVENT_STOP)
        }
        ,
        AudioPlayer.prototype.isPlaying = function() {
            return this._isPlaying
        }
        ,
        AudioPlayer.prototype.getCurrentAudio = function() {
            return this._currentAudio
        }
        ,
        AudioPlayer.prototype.playNext = function(t, e) {
            this._playNext(1, t)
        }
        ,
        AudioPlayer.prototype.playPrev = function() {
            this._playNext(-1)
        }
        ,
        AudioPlayer.prototype._playNext = function(t, e) {
            if (!this._adsIsAdPlaying()) {
                var i = 10
                    , o = this.getCurrentAudio()
                    , a = this.getCurrentPlaylist();
                if (o && a)
                    if (t > 0) {
                        for (var s = a.getNextAudio(o); i && s && AudioUtils.isClaimedAudio(s); )
                            s = a.getNextAudio(s),
                                i--;
                        s ? this.play(s, a, 1, e) : a.isLive() ? (this._muteProgressEvents = !0,
                            a.fetchNextLiveAudio(function(t) {
                                this.play(t, a, 1, e)
                            }
                                .bind(this))) : (s = a.getAudioAt(0),
                            this.play(s, a, 1, e))
                    } else {
                        var r = a.indexOfAudio(this._currentAudio) - 1;
                        if (0 > r)
                            this.seek(0);
                        else {
                            for (var l = a.getAudioAt(r); i && l && AudioUtils.isClaimedAudio(l); )
                                l = a.getAudioAt(--r),
                                    i--;
                            this.play(l, a, -1, e)
                        }
                    }
            }
        }
        ,
        AudioPlayer.prototype._adsPlayAd = function(t, e) {
            var i = !1;
            this._adman.onCompleted(function() {
                this._adsDeinit(!0),
                    this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                    this.notify(AudioPlayer.EVENT_AD_COMPLETED),
                    delete this._adsPlaying,
                    delete this._adsCurrentProgress,
                i || this._adsSendAdEvent("error", t),
                    this._adsSendAdEvent("completed", t),
                    document.title = this._adsPrevTitle,
                e && e()
            }
                .bind(this)),
                this._adman.onStarted(function() {
                    i = !0,
                        this._isPlaying = !0,
                        this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                        this.notify(AudioPlayer.EVENT_AD_STARTED),
                        this._adsUpdateVolume(),
                        this._adsSendAdEvent("started", t)
                }
                    .bind(this));
            var o = [.25, .5, .75];
            this._adman.onTimeRemained(function(e) {
                this._adsCurrentProgress = e.percent / 100,
                    this.notify(AudioPlayer.EVENT_PROGRESS, e.percent / 100, e.duration),
                    each(o, function(e, i) {
                        return this._adsCurrentProgress >= i ? (o.shift(),
                            this._adsSendAdEvent("progress_" + intval(100 * i), t),
                            !1) : void 0
                    }
                        .bind(this))
            }
                .bind(this)),
                this._adman.start(AudioPlayer.AD_TYPE),
                this._adsPlaying = !0,
                this.notify(AudioPlayer.EVENT_PLAY),
                this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                this._adsPrevTitle = document.title,
                document.title = getLang("global_audio_ad")
        }
        ,
        AudioPlayer.prototype._adsUpdateVolume = function() {
            this._adman && this._adman.setVolume(.7 * this.getVolume())
        }
        ,
        AudioPlayer.prototype._adsSendAdEvent = function(t, e) {
            this._adEvents = this._adEvents || [],
                this._adEvents.push(t + "/" + e),
                clearTimeout(this._adEventDelay),
                this._adEventDelay = setTimeout(function() {
                    ajax.post("al_audio.php", {
                        act: "ad_event",
                        events: this._adEvents.join(","),
                        v: this.getVersion(),
                        abp: window.abp
                    }),
                        this._adEvents = []
                }
                    .bind(this), 500)
        }
        ,
        AudioPlayer.prototype.adsGetCurrentProgress = function() {
            return this._adsCurrentProgress || 0
        }
        ,
        AudioPlayer.prototype._adsPauseAd = function() {
            this._adman && (this._isPlaying = !1,
                this._adman.pause(),
                this.notify(AudioPlayer.EVENT_PAUSE))
        }
        ,
        AudioPlayer.prototype._adsResumeAd = function() {
            this._adman && (this._isPlaying = !0,
                this._adman.resume(),
                this.notify(AudioPlayer.EVENT_PLAY))
        }
        ,
        AudioPlayer.prototype._adsIsAdPlaying = function() {
            return this._adsPlaying
        }
        ,
        AudioPlayer.prototype.isAdPlaying = function() {
            return this._adsIsAdPlaying()
        }
        ,
        AudioPlayer.prototype._adsDeinit = function(t) {
            this._adman = null,
            !t && this.notify(AudioPlayer.EVENT_AD_DEINITED)
        }
        ,
        AudioPlayer.ADS_ALLOW_DISABLED = 1,
        AudioPlayer.ADS_ALLOW_ALLOWED = 2,
        AudioPlayer.ADS_ALLOW_REJECT = 3,
        AudioPlayer.prototype._adsIsAllowed = function(t, e) {
            if (vk.widget)
                return AudioPlayer.ADS_ALLOW_DISABLED;
            if (cur.adsPreview)
                return AudioPlayer.ADS_ALLOW_ALLOWED;
            var i = this._adsConfig || vk.audioAdsConfig;
            return i ? i.enabled ? inArray(e.getPlaybackSection(), i.sections) ? i.day_limit_reached ? AudioPlayer.ADS_ALLOW_REJECT : AudioPlayer.ADS_ALLOW_ALLOWED : AudioPlayer.ADS_ALLOW_REJECT : AudioPlayer.ADS_ALLOW_DISABLED : AudioPlayer.ADS_ALLOW_REJECT
        }
        ,
        AudioPlayer.prototype._adsFetchAd = function(t, e, i, o) {
            this._loadAdman(function() {
                function a(t, e) {
                    for (var i = (t >>> 0).toString(16), o = e.toString(16); o.length < 8; )
                        o = "0" + o;
                    return i + o
                }
                if (!window.AdmanHTML)
                    return this._adsSendAdEvent("no_adman", e),
                    o && o();
                var s = {
                    my: 101,
                    my_album: 101,
                    audio_feed: 109,
                    recent: 113,
                    user_wall: 104,
                    group_wall: 104,
                    friend: 112,
                    user_list: 102,
                    group_list: 103,
                    feed: 105,
                    search: 110,
                    global_search: 110,
                    replies: 104,
                    im: 106,
                    group_status: 104,
                    user_status: 104,
                    recs: 107,
                    recs_audio: 107,
                    recs_album: 107,
                    pop: 108,
                    pop_genre: 108,
                    pop_band: 111,
                    other: 114
                };
                this._adman = new AdmanHTML;
                var r = {
                    _SITEID: 276,
                    ver: 251116,
                    vk_id: vk.id,
                    duration: t.duration,
                    content_id: a(t.ownerId, t.id),
                    vk_catid: s[e] || s.other
                };
                nav.objLoc.preview && (r.preview = intval(nav.objLoc.preview)),
                cur.adsPreview && (r.preview = 1),
                    this._adman.setDebug(!!r.preview),
                    this._adman.onReady(function() {
                        if (this._adman) {
                            var t = this._adman.getBannersForSection(AudioPlayer.AD_TYPE);
                            t && t.length ? (this._adsSendAdEvent("received", e),
                                i ? (this._adsSendAdEvent("rejected", e),
                                    this._adsDeinit(),
                                o && o()) : (this._adsSendAdEvent("ready", e),
                                    this.notify(AudioPlayer.EVENT_AD_READY),
                                    this._adsPlayAd(e, o))) : (i || this._adsSendAdEvent("not_received", e),
                            o && o())
                        }
                    }
                        .bind(this)),
                    this._adman.init({
                        slot: 3514,
                        wrapper: se("<div></div>"),
                        params: r,
                        browser: {
                            adBlock: !!window.abp,
                            mobile: !1
                        }
                    }),
                    this._adsSendAdEvent("requested", e)
            }
                .bind(this))
        }
        ,
        AudioPlayer.prototype._loadAdman = function(t) {
            return this._admadLoaded ? t && t() : void loadScript("//ad.mail.ru/static/admanhtml/rbadman-html5.min.js", {
                onLoad: function() {
                    this._admadLoaded = !0,
                    t && t()
                }
                    .bind(this),
                onError: function() {
                    this._admadLoaded = !0,
                    t && t()
                }
                    .bind(this)
            })
        }
        ,
        window.AudioPlayerFlash = function(t) {
            this.opts = t || {},
                window._flashAudioInstance = this
        }
        ,
        AudioPlayerFlash.onAudioFinishCallback = function() {
            var t = window._flashAudioInstance;
            t.opts.onEnd && t.opts.onEnd()
        }
        ,
        AudioPlayerFlash.onAudioProgressCallback = function(t, e) {
            var i = window._flashAudioInstance;
            e && (i._total = e,
                i._currProgress = t / e,
            i.opts.onProgressUpdate && i.opts.onProgressUpdate(i._currProgress, t))
        }
        ,
        AudioPlayerFlash.onAudioLoadProgressCallback = function(t, e) {
            var i = window._flashAudioInstance;
            i._currBuffered = t / e,
            i.opts.onBufferUpdate && i.opts.onBufferUpdate(i._currBuffered)
        }
        ,
        AudioPlayerFlash.prototype.fadeVolume = function(t, e) {
            return this.setVolume(t),
                e()
        }
        ,
        AudioPlayerFlash.prototype._stopFrequencyAnalise = function() {
            this._stopFrequencyAnaliseCallback && this._stopFrequencyAnaliseCallback(),
                delete this._stopFrequencyAnaliseCallback,
                clearInterval(this._freqUpdateInterval),
                this.opts.onFrequency([0, 0, 0, 0])
        }
        ,
        AudioPlayerFlash.prototype._startFrequencyAnalise = function() {
            function t(t, e, i, o) {
                var a = i - e;
                return a * t / o + e
            }
            function e(t, e) {
                return Math.random() * (e - t) + t
            }
            var i = this;
            this._stopFrequencyAnalise();
            var o = 999
                , a = 3
                , s = null
                , r = null;
            this._freqUpdateInterval = setInterval(function() {
                var l = void 0;
                o++,
                o > a && (o = 0,
                    s = r,
                    r = [e(.7, 1), e(.55, .8), e(.3, .55), e(.03, .45)],
                s || (s = [e(.7, 1), e(.55, .8), e(.3, .55), e(.03, .45)])),
                    l = [t(o, s[0], r[0], a), t(o, s[1], r[1], a), t(o, s[2], r[2], a), t(o, s[3], r[3], a)],
                    i.opts.onFrequency(l)
            }, 50)
        }
        ,
        AudioPlayerFlash.prototype.type = "flash",
        AudioPlayerFlash.PLAYER_EL_ID = "flash_audio",
        AudioPlayerFlash.prototype.destroy = function() {
            re(AudioPlayerFlash.PLAYER_EL_ID)
        }
        ,
        AudioPlayerFlash.prototype.onReady = function(t) {
            if (this._player)
                return t(!0);
            if (this._player === !1)
                return t(!1);
            this._onReady = t;
            var e = {
                url: "/swf/audio_lite.swf",
                id: "player",
                height: 2
            }
                , i = {
                swliveconnect: "true",
                allowscriptaccess: "always",
                wmode: "opaque"
            }
                , o = {
                onPlayFinish: "AudioPlayerFlash.onAudioFinishCallback",
                onLoadProgress: "AudioPlayerFlash.onAudioLoadProgressCallback",
                onPlayProgress: "AudioPlayerFlash.onAudioProgressCallback"
            };
            ge(AudioPlayerFlash.PLAYER_EL_ID) || document.body.appendChild(ce("div", {
                id: AudioPlayerFlash.PLAYER_EL_ID,
                className: "fixed"
            }));
            var a = this;
            renderFlash(AudioPlayerFlash.PLAYER_EL_ID, e, i, o) && setTimeout(function() {
                a._checkFlashLoaded()
            }, 50)
        }
        ,
        AudioPlayerFlash.prototype.setUrl = function(t, e) {
            var i = (0,
                _audio_unmask_source.audioUnmaskSource)(t);

            return this._url == i ? void (e && e(!0)) : (this._url = i,
            this._player && this._player.loadAudio(i),
                void (e && e(!0)))
        }
        ,
        AudioPlayerFlash.prototype.setVolume = function(t) {
            this._player && this._player.setVolume && this._player.setVolume(t)
        }
        ,
        AudioPlayerFlash.prototype.play = function() {
            this._player && this._player.playAudio(),
                this._startFrequencyAnalise()
        }
        ,
        AudioPlayerFlash.prototype.seek = function(t) {
            var e = (this._total || 0) * t;
            this._player && this._player.playAudio(e)
        }
        ,
        AudioPlayerFlash.prototype.pause = function() {
            this._player && this._player.pauseAudio(),
                this._stopFrequencyAnalise()
        }
        ,
        AudioPlayerFlash.prototype.isFullyLoaded = function() {
            return !1
        }
        ,
        AudioPlayerFlash.prototype.getPlayedTime = function() {
            return 0
        }
        ,
        AudioPlayerFlash.prototype.getCurrentProgress = function() {
            return this._currProgress || 0
        }
        ,
        AudioPlayerFlash.prototype.getCurrentBuffered = function() {
            return this._currBuffered || 0
        }
        ,
        AudioPlayerFlash.prototype.stop = function() {
            this._player && this._player.stopAudio(),
                this._stopFrequencyAnalise()
        }
        ,
        AudioPlayerFlash.prototype._checkFlashLoaded = function() {
            var t = ge("player");
            if (this._checks = this._checks || 0,
                    this._checks++,
                    AudioUtils.debugLog("Flash element check", this._checks),
                this._checks > 10)
                return AudioUtils.debugLog("No Flash element found after some amount of checks"),
                    this._player = !1,
                this._onReady && this._onReady(!1);
            if (t && t.paused)
                AudioUtils.debugLog("Flash element found"),
                    this._player = t,
                this._onReady && this._onReady(!0),
                    this._onReady = null;
            else {
                var e = this;
                setTimeout(function() {
                    e._checkFlashLoaded()
                }, 100)
            }
        }
        ,
        window.AudioPlayerHTML5WebAudio = function(t) {
            this._opts = t;
            this._audio = new Audio;
            this._audio.crossOrigin = "anonymous";
            "AudioContext" in window ? this._context = new AudioContext : "webkitAudioContext" in window && (this._context = new webkitAudioContext);

            this.musicBar = new MusicBar(this._context);

            this._context.suspend();
            this._toggleContext(!1);
            this._analyser = this._context.createAnalyser();
            this._analyser.fftSize = 32;
            this._analyser.smoothingTimeConstant = 0.3;

            this._processor = this._context.createScriptProcessor(256, 1,1);
            this._analyser.connect(this._processor);

            // Create Bands for analyser
            var bands = new Uint8Array(this._analyser.frequencyBinCount);

            this._processor.onaudioprocess = function() {
                getAudioPlayer()._impl._analyser.getByteFrequencyData(bands);
            };

            window.setInterval(function(){
                if (getAudioPlayer()._impl.musicBar.params.visualization)
                    getAudioPlayer()._impl.musicBar.updateVisualization(bands);
            }, 100);


            this._gainNode = this._context.createGain();
            this._analyser.connect(this._gainNode);
            this._gainNode.connect(this._context.destination);
            this._processor.connect(this._context.destination);
            this.type = "html5webapi";



        },
        AudioPlayerHTML5WebAudio.isSupported = function() {
            if (browser.safari)
                return !1;
            var t = "undefined" != typeof navigator ? navigator.userAgent : "";
            if (/(Windows NT 5.1|Windows XP)/.test(t) && (browser.vivaldi || browser.opera || browser.mozilla))
                return !1;
            if (/(Windows 7|Windows NT 6.1)/.test(t) && (browser.vivaldi || browser.opera))
                return !1;
            var e = document.createElement("audio");
            if (e.canPlayType) {
                var i = e.canPlayType('audio/mpeg; codecs="mp3"')
                    , o = !!i.replace(/no/, "");
                return o && ("AudioContext"in window || "webkitAudioContext"in window)
            }
            return !1
        }
        ,
        AudioPlayerHTML5WebAudio.VOLUME_FADE_DURATION = 300,
        AudioPlayerHTML5WebAudio.prototype._toggleContext = function(t) {
            var e = this;
            clearWorkerTimeout(this._toggleContextTO),
            t && "running" == this._context.state || (t || "suspended" != this._context.state) && (t ? this._context.resume() : this._toggleContextTO = setWorkerTimeout(function() {
                e._context.suspend()
            }, 1e3))
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.setUrl = function(t, e) {
            var i = this;
            this._createAudioNode(t, function() {
                var t = i._seekOnReady;
                delete i._seekOnReady,
                t && i.seek(t)
            }),
            e && e(!0)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.getCurrentProgress = function() {
            var t = this._audio;
            return isNaN(t.duration) ? 0 : Math.max(0, Math.min(1, t.currentTime / t.duration))
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.getPlayedTime = function() {
            for (var t = this._audio.played, e = 0, i = 0; i < t.length; i++)
                e += t.end(i) - t.start(i);
            return e
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.getCurrentBuffered = function() {
            return this._audio.buffered.length ? Math.min(1, this._audio.buffered.end(0) / this._audio.duration) : 0
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.onReady = function(t) {
            return t && t(!0)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.setVolume = function(t) {
            this._gainNode.gain.linearRampToValueAtTime(t, this._context.currentTime + .01)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.fadeVolume = function(t, e) {
            this._toggleContext(!0),
                this._gainNode.gain.linearRampToValueAtTime(t, this._context.currentTime + AudioPlayerHTML5WebAudio.VOLUME_FADE_DURATION / 1e3),
                clearWorkerTimeout(this._fadeTO),
                this._fadeTO = setWorkerTimeout(function() {
                    e(!0)
                }, AudioPlayerHTML5WebAudio.VOLUME_FADE_DURATION + 50)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.isFullyLoaded = function() {
            return !!this._audio._fullyLoaded
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.seek = function(t) {
            var e = this._audio;
            isNaN(e.duration) ? this._seekOnReady = t : e.currentTime = e.duration * t
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.pause = function() {
            this._audio.pause(),
                this._toggleContext(!1)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.stop = function() {
            this.pause()
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.play = function(t) {
            function e(t) {
                isUndefined(t) || t["catch"](function(t) {
                    t.code != t.ABORT_ERR && setWorkerTimeout(function() {
                        triggerEvent(o, "error", !1, !0)
                    }, 500)
                })
            }
            var i = this;
            this._toggleContext(!0);
            var o = this._audio;
            this._audio.src != t ? this._createAudioNode(t, function() {
                e(o.play()),
                    i._startFreqAnalyse()
            }) : (e(o.play()),
                this._startFreqAnalyse())
        }
        ,
        AudioPlayerHTML5WebAudio.prototype._createAudioNode = function(t, e) {
            var i = this;
            return this._audio && this._audio.src == t ? this._audio._canPlay ? e && e() : (this._audio.onCanPlays = this._audio.onCanPlays || [],
                void this._audio.onCanPlays.push(e)) : (this._source && this._source.disconnect(),
                this._audio = new Audio,
                this._audio.crossOrigin = "anonymous",
                this._audio.onCanPlays = [e],
                this._source = this._context.createMediaElementSource(this._audio),
                this._source.connect(this._analyser),
                this._audio.src = t,
                this._audio.addEventListener("canplay", function() {
                    if (!i._audio._canPlay) {
                        i._audio._canPlay = !0,
                        i._opts.onCanPlay && i._opts.onCanPlay();
                        var t = i._audio.onCanPlays;
                        each(t, function(t, e) {
                            e && e()
                        })
                    }
                }),
                this._audio.addEventListener("timeupdate", function() {
                    i._opts.onProgressUpdate && i._opts.onProgressUpdate(i.getCurrentProgress(), i.getPlayedTime())
                }),
                this._audio.addEventListener("progress", function() {
                    i._opts.onBufferUpdate && i._opts.onBufferUpdate(i.getCurrentBuffered());
                    var t = i._audio.buffered;
                    1 == t.length && 0 == t.start(0) && t.end(0) == i._audio.duration && (i._audio._fullyLoaded = !0)
                }),
                this._audio.addEventListener("ended", function() {
                    i._opts.onEnd && i._opts.onEnd()
                }),
                this._audio.addEventListener("seeked", function() {
                    i._opts.onSeeked && i._opts.onSeeked()
                }),
                this._audio.addEventListener("seeking", function() {
                    i._opts.onSeek && i._opts.onSeek()
                }),
                void this._audio.addEventListener("error", function() {
                    i._opts.onFail && i._opts.onFail()
                }))
        }
        ,
        AudioPlayerHTML5WebAudio.prototype._startFreqAnalyse = function() {
            var t = this;
            this._stopFreqAnalyse();
            var e = new Uint8Array(this._analyser.frequencyBinCount);
            this._freqUpdateInterval = setInterval(function() {
                t._analyser.getByteFrequencyData(e);
                var i = 255
                    , o = e.length
                    , a = [Math.min(255, 1.2 * e[Math.round(.05 * o)]) / i, Math.min(255, 1.2 * e[Math.round(.15 * o)]) / i, Math.min(255, 1.3 * e[Math.round(.3 * o)]) / i, Math.min(255, 1.4 * e[Math.round(.55 * o)]) / i];
                t._opts.onFrequency && t._opts.onFrequency(a)
            }, 30)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype._stopFreqAnalyse = function() {
            clearInterval(this._freqUpdateInterval)
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.destroy = function() {
            this._stopFreqAnalyse()
        }
        ,
        AudioPlayerHTML5WebAudio.prototype.prefetch = function(t) {
            var e = new Audio;
            e.src = t
        }
        ,
        window.AudioPlayerHTML5 = function(t) {
            this.opts = t || {},
                this._audioNodes = [],
                this._currentAudioEl = this._createAudioNode(),
                this._prefetchAudioEl = this._createAudioNode()
        }
        ,
        AudioPlayerHTML5.AUDIO_EL_ID = "ap_audio",
        AudioPlayerHTML5.STATE_HAVE_NOTHING = 0,
        AudioPlayerHTML5.STATE_HAVE_FUTURE_DATA = 3,
        AudioPlayerHTML5.HAVE_ENOUGH_DATA = 4,
        AudioPlayerHTML5.SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
        AudioPlayerHTML5.isSupported = function() {
            var t = "undefined" != typeof navigator ? navigator.userAgent : "";
            if (/(Windows NT 5.1|Windows XP)/.test(t) && (browser.vivaldi || browser.opera || browser.mozilla))
                return AudioUtils.debugLog("Force no HTML5 (xp vivaldi / opera / mozilla)"),
                    !1;
            if (/(Windows 7|Windows NT 6.1)/.test(t) && (browser.vivaldi || browser.opera))
                return AudioUtils.debugLog("Force no HTML5 (win7 vivaldi / opera)"),
                    !1;
            var e = document.createElement("audio");
            if (e.canPlayType) {
                var i = e.canPlayType('audio/mpeg; codecs="mp3"')
                    , o = !!i.replace(/no/, "");
                return AudioUtils.debugLog("HTML5 browser support " + (o ? "yes" : "no"), i, t),
                    o
            }
            return AudioUtils.debugLog("audio.canPlayType is not available", t),
                !1
        }
        ,
        AudioPlayerHTML5.prototype.type = "html5",
        AudioPlayerHTML5.prototype.destroy = function() {}
        ,
        AudioPlayerHTML5.prototype.getPlayedTime = function() {
            for (var t = this._currentAudioEl.played, e = 0, i = 0; i < t.length; i++)
                e += t.end(i) - t.start(i);
            return e
        }
        ,
        AudioPlayerHTML5.prototype._setAudioNodeUrl = function(t, e) {
            var i = (0,
                _audio_unmask_source.audioUnmaskSource)(e);
            data(t, "setUrlTime", i == AudioPlayerHTML5.SILENCE ? 0 : vkNow()),
                t.src = i
        }
        ,
        AudioPlayerHTML5.prototype._createAudioNode = function(t) {
            var e = new Audio
                , i = this;
            return this.opts.onBufferUpdate && addEvent(e, "progress", function() {
                i._currentAudioEl == e && i.opts.onBufferUpdate(i.getCurrentBuffered());
                var t = e.buffered;
                1 == t.length && 0 == t.start(0) && t.end(0) == e.duration && (e._fullyLoaded = !0)
            }),
            this.opts.onProgressUpdate && addEvent(e, "timeupdate", function() {
                this._currentAudioEl == e && this.opts.onProgressUpdate(this.getCurrentProgress(), this.getPlayedTime())
            }
                .bind(this)),
            this.opts.onEnd && addEvent(e, "ended", function() {
                i._currentAudioEl == e && i.opts.onEnd()
            }),
            this.opts.onSeeked && addEvent(e, "seeked", function() {
                i._currentAudioEl == e && i.opts.onSeeked()
            }),
            this.opts.onSeek && addEvent(e, "seeking", function() {
                i._currentAudioEl == e && i.opts.onSeek()
            }),
                addEvent(e, "error", function() {
                    AudioUtils.debugLog("HTML5 error track loding"),
                        i._prefetchAudioEl == e ? i._prefetchAudioEl = i._createAudioNode() : i._currentAudioEl == e && e.src != AudioPlayerHTML5.SILENCE && i.opts.onFail && i.opts.onFail()
                }),
                addEvent(e, "canplay", function() {
                    var t = data(e, "setUrlTime");
                    t && (cur.audioLoadTimings = cur.audioLoadTimings || [],
                        cur.audioLoadTimings.push(vkNow() - t),
                        data(e, "setUrlTime", 0)),
                    i._prefetchAudioEl == e,
                    i._currentAudioEl == e && (i.opts.onCanPlay && i.opts.onCanPlay(),
                        data(e, "canplay", !0),
                    i._seekOnReady && (i.seek(i._seekOnReady),
                        i._seekOnReady = !1))
                }),
                e.crossOrigin = "anonymous",
            t && (this._setAudioNodeUrl(e, t),
                e.preload = "auto",
                e.volume = this._volume || 1,
                e.load()),
                this._audioNodes.push(e),
            this._audioNodes.length > 10 && this._audioNodes.splice(0, 5),
                e
        }
        ,
        AudioPlayerHTML5.prototype.onReady = function(t) {
            t(!0)
        }
        ,
        AudioPlayerHTML5.prototype.prefetch = function(t) {
            this._prefetchAudioEl && this._setAudioNodeUrl(this._prefetchAudioEl, AudioPlayerHTML5.SILENCE),
                this._prefetchAudioEl = this._createAudioNode(t)
        }
        ,
        AudioPlayerHTML5.prototype.seek = function(t) {
            var e = this._currentAudioEl;
            isNaN(e.duration) ? this._seekOnReady = t : e.currentTime = e.duration * t
        }
        ,
        AudioPlayerHTML5.prototype.setVolume = function(t) {
            void 0 === t && (t = this._currentAudioEl.volume),
                this._currentAudioEl.volume = t,
            this._prefetchAudioEl && (this._prefetchAudioEl.volume = t),
                this._volume = t
        }
        ,
        AudioPlayerHTML5.prototype.getCurrentProgress = function() {
            var t = this._currentAudioEl;
            return isNaN(t.duration) ? 0 : Math.max(0, Math.min(1, t.currentTime / t.duration))
        }
        ,
        AudioPlayerHTML5.prototype.getCurrentBuffered = function() {
            var t = this._currentAudioEl;
            return t && t.buffered.length ? Math.min(1, t.buffered.end(0) / t.duration) : 0
        }
        ,
        AudioPlayerHTML5.prototype.isFullyLoaded = function() {
            return this._currentAudioEl._fullyLoaded
        }
        ,
        AudioPlayerHTML5.prototype.setUrl = function(t, e) {
            var i = this._currentAudioEl
                , o = (0,
                _audio_unmask_source.audioUnmaskSource)(t);
            if (this._seekOnReady = !1,
                i.src == o)
                return this.opts.onCanPlay && this.opts.onCanPlay(),
                e && e(!0);
            if (this._prefetchAudioEl && this._prefetchAudioEl.readyState > AudioPlayerHTML5.STATE_HAVE_NOTHING)
                if (this._prefetchAudioEl.src == o) {
                    this._currentAudioEl.pause(0),
                        this._setAudioNodeUrl(this._currentAudioEl, AudioPlayerHTML5.SILENCE);
                    var a = this;
                    this._prefetchAudioEl.readyState >= AudioPlayerHTML5.STATE_HAVE_FUTURE_DATA && setTimeout(function() {
                        a.opts.onCanPlay && a.opts.onCanPlay()
                    }),
                        i = this._currentAudioEl = this._prefetchAudioEl,
                        this._prefetchAudioEl = !1
                } else
                    this._prefetchAudioEl.src && this._setAudioNodeUrl(this._prefetchAudioEl, AudioPlayerHTML5.SILENCE);
            return i.src != o && (this._setAudioNodeUrl(i, o),
                i.load(),
                data(this._currentAudioEl, "canplay", null),
                this._stopFrequencyAnalise()),
            e && e(!0)
        }
        ,
        AudioPlayerHTML5.prototype.play = function(t) {
            this._stopFrequencyAnalise(),
            this._prefetchAudioEl.src == (0,
                _audio_unmask_source.audioUnmaskSource)(t) && this._prefetchAudioEl.readyState > AudioPlayerHTML5.STATE_HAVE_NOTHING && (this._setAudioNodeUrl(this._currentAudioEl, AudioPlayerHTML5.SILENCE),
                this._currentAudioEl = this._prefetchAudioEl,
                this._prefetchAudioEl = this._createAudioNode(),
            this.opts.onCanPlay && this.opts.onCanPlay());
            var e = this._currentAudioEl;
            if (e.src) {
                var i = e.play();
                isUndefined(i) || i["catch"](function(t) {
                    t.code != t.ABORT_ERR ? setWorkerTimeout(function() {
                        triggerEvent(e, "error", !1, !0)
                    }, 10) : debugLog("HTML5 audio play error: " + t)
                }),
                    this._startFrequencyAnalise()
            }
        }
        ,
        AudioPlayerHTML5.prototype._stopFrequencyAnalise = function() {
            this._stopFrequencyAnaliseCallback && this._stopFrequencyAnaliseCallback(),
                delete this._stopFrequencyAnaliseCallback,
                clearInterval(this._freqUpdateInterval),
                this.opts.onFrequency([0, 0, 0, 0])
        }
        ,
        AudioPlayerHTML5.prototype._startFrequencyAnalise = function() {
            function t(t, e, i, o) {
                var a = i - e;
                return a * t / o + e
            }
            function e(t, e) {
                return Math.random() * (e - t) + t
            }
            var i = this;
            this._stopFrequencyAnalise();
            var o = 999
                , a = 3
                , s = null
                , r = null;
            this._freqUpdateInterval = setInterval(function() {
                var l = void 0;
                i._currentAudioEl.paused || !data(i._currentAudioEl, "canplay") ? l = [0, 0, 0, 0] : (o++,
                o > a && (o = 0,
                    s = r,
                    r = [e(.7, 1), e(.55, .8), e(.3, .55), e(.03, .45)],
                s || (s = [e(.7, 1), e(.55, .8), e(.3, .55), e(.03, .45)])),
                    l = [t(o, s[0], r[0], a), t(o, s[1], r[1], a), t(o, s[2], r[2], a), t(o, s[3], r[3], a)]),
                    i.opts.onFrequency(l)
            }, 50)
        }
        ,
        AudioPlayerHTML5.prototype.pause = function() {
            var t = this._currentAudioEl;
            if (t.src) {
                var e = t.pause();
                void 0 != e && e["catch"](function() {})
            }
            this._stopFrequencyAnalise()
        }
        ,
        AudioPlayerHTML5.prototype.stop = function() {
            this._currentAudioEl.pause(),
                this._currentAudioEl = this._createAudioNode(AudioPlayerHTML5.SILENCE),
                this._stopFrequencyAnalise()
        }
        ,
        AudioPlayerHTML5.prototype._setFadeVolumeInterval = function(t) {
            if (t) {
                if (!this._fadeVolumeWorker && window.Worker && window.Blob) {
                    var e = new Blob(["           var interval;           onmessage = function(e) {             clearInterval(interval);             if (e.data == 'start') {               interval = setInterval(function() { postMessage({}); }, 20);             }           }         "]);
                    try {
                        this._fadeVolumeWorker = new Worker(window.URL.createObjectURL(e))
                    } catch (i) {
                        this._fadeVolumeWorker = !1
                    }
                }
                this._fadeVolumeWorker ? (this._fadeVolumeWorker.onmessage = t,
                    this._fadeVolumeWorker.postMessage("start")) : this._fadeVolumeInterval = setInterval(t, 60)
            } else
                this._fadeVolumeWorker && (this._fadeVolumeWorker.terminate(),
                    this._fadeVolumeWorker = null),
                this._fadeVolumeInterval && clearInterval(this._fadeVolumeInterval)
        }
        ,
        AudioPlayerHTML5.prototype.fadeVolume = function(t, e) {
            console.log(t),
                t = Math.max(0, Math.min(1, t));
            var i = this._currentAudioEl
                , o = 0;
            if (o = t < i.volume ? -.06 : .001,
                Math.abs(t - i.volume) <= .001)
                return this._setFadeVolumeInterval(),
                e && e();
            var a = i.volume;
            this._setFadeVolumeInterval(function() {
                o > 0 && (o *= 1.35),
                    a += o;
                var i = !1;
                return (i = 0 > o ? t >= a : a >= t) ? (this.setVolume(t),
                    this._setFadeVolumeInterval(),
                e && e()) : void this.setVolume(a)
            }
                .bind(this))
        }
        ,
        window.loadScript = function(t, e) {
            function i(t) {
                n.readyState && "loaded" != n.readyState && "complete" != n.readyState || (a(),
                r && r())
            }
            function o(t) {
                a(),
                l && l()
            }
            function a() {
                clearTimeout(u),
                    n.removeEventListener("load", i),
                    n.removeEventListener("readystatechange", i),
                    n.removeEventListener("error", o)
            }
            var s = e.timeout
                , r = e.onLoad
                , l = e.onError
                , n = document.createElement("script");
            if (n.addEventListener("load", i),
                    n.addEventListener("readystatechange", i),
                    n.addEventListener("error", o),
                    n.src = t,
                    document.head.appendChild(n),
                    s)
                var u = setTimeout(o, s);
            return {
                destroy: function() {
                    a()
                }
            }
        }
        ;
        try {
            stManager.done("audioplayer.js")
        } catch (e) {}
    }
]);
