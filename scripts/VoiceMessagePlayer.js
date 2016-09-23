!function(t) {
    function e(o) {
        if (i[o])
            return i[o].exports;
        var s = i[o] = {
            exports: {},
            id: o,
            loaded: !1
        };
        return t[o].call(s.exports, s, s.exports, e),
            s.loaded = !0,
            s.exports
    }
    var i = {};
    return e.m = t,
        e.c = i,
        e.p = "",
        e(0)
}({
    0: function(t, e, i) {
        t.exports = i(137)
    },
    32: function(t, e, i) {
        "use strict";
        function o(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        function s(t, e) {
            var i = arguments.length <= 2 || void 0 === arguments[2] ? "peak" : arguments[2];
            return new l({
                srcSampleRate: t.length,
                dstSampleRate: e,
                normalizeAlgorithm: i,
                truncateTo: 0
            }).push(t)
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        }),
            e.Resampler = void 0,
            e.fastResample = s;
        var a = i(46)
            , n = i(47)
            , r = i(48)
            , u = {
            avg: a.AverageAlgorithm,
            peak: n.PeakAlgorithm,
            quad: r.QuadAlgorithm
        }
            , l = e.Resampler = function() {
            function t(e) {
                o(this, t),
                    this._normalizeAlgorithm = !1,
                u[e.normalizeAlgorithm] && (this._normalizeAlgorithm = new u[e.normalizeAlgorithm]),
                    this._srcSampleRate = parseInt(e.srcSampleRate || 0),
                    this._dstSampleRate = parseInt(e.dstSampleRate || 0),
                    this._truncateTo = 1,
                "undefined" != typeof e.truncateTo && (this._truncateTo = e.truncateTo),
                    this._sampleRate = this._srcSampleRate / this._dstSampleRate,
                u[e.algorithm] || (e.algorithm = "peak"),
                    this._algorithm = new u[e.algorithm],
                    this._sampleCount = 0,
                    this._data = []
            }
            return t.prototype.push = function(t) {
                if (this._sampleRate <= 0)
                    return [];
                for (var e, i = [], o = 0; o < t.length; o++)
                    if (this._truncateTo > 0 && (t[o] = Math.min(this._truncateTo, Math.abs(t[o]))),
                            this._sampleCount += 1,
                        this._sampleCount >= this._sampleRate)
                        for (; this._sampleCount >= this._sampleRate; )
                            this._sampleCount -= this._sampleRate,
                            this._sampleCount <= .8 && this._algorithm.push(t[o]),
                                e = this._algorithm.get(),
                                i.push(e),
                            this._normalizeAlgorithm && this._normalizeAlgorithm.push(e),
                                this._algorithm.clear(),
                            this._sampleCount > .2 && this._algorithm.push(t[o]);
                    else
                        this._algorithm.push(t[o]);
                if (this._normalizeAlgorithm) {
                    var s = this._normalizeAlgorithm.get();
                    this._normalizeAlgorithm.clear();
                    for (var a = 0; a < i.length; a++)
                        i[a] = i[a] / s,
                        this._truncateTo > 0 && (i[a] = Math.min(this._truncateTo, Math.abs(i[a])))
                }
                return i
            }
                ,
                t
        }()
    },
    46: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        e.AverageAlgorithm = function() {
            function t() {
                i(this, t),
                    this.clear()
            }
            return t.prototype.push = function(t) {
                this._count++,
                    this._accum += t
            }
                ,
                t.prototype.get = function() {
                    return this._accum / this._count
                }
                ,
                t.prototype.clear = function() {
                    this._count = 0,
                        this._accum = 0
                }
                ,
                t
        }()
    },
    47: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        e.PeakAlgorithm = function() {
            function t() {
                i(this, t),
                    this.clear()
            }
            return t.prototype.push = function(t) {
                this._max = Math.max(this._max, Math.abs(t))
            }
                ,
                t.prototype.get = function() {
                    return this._max
                }
                ,
                t.prototype.clear = function() {
                    this._max = 0
                }
                ,
                t
        }()
    },
    48: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        e.QuadAlgorithm = function() {
            function t() {
                i(this, t),
                    this.clear()
            }
            return t.prototype.push = function(t) {
                this._count++,
                    this._accum += t,
                    this._accum_q += t * t
            }
                ,
                t.prototype.get = function() {
                    return 1 == this._count ? this._accum : Math.sqrt((this._accum_q - this._accum * this._accum / this._count) / this._count)
                }
                ,
                t.prototype.clear = function() {
                    this._count = 0,
                        this._accum = 0,
                        this._accum_q = 0
                }
                ,
                t
        }()
    },
    102: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var o = function() {
            function t(t, e) {
                for (var i = 0; i < e.length; i++) {
                    var o = e[i];
                    o.enumerable = o.enumerable || !1,
                        o.configurable = !0,
                    "value"in o && (o.writable = !0),
                        Object.defineProperty(t, o.key, o)
                }
            }
            return function(e, i, o) {
                return i && t(e.prototype, i),
                o && t(e, o),
                    e
            }
        }()
            , s = e.PlayerFlash = function() {
            function t(e) {
                i(this, t),
                    this.opts = e || {},
                    window._flashAudioInstance = this
            }
            return t.prototype.fadeVolume = function(t, e) {
                return this.setVolume(t),
                    e()
            }
                ,
                t.prototype.destroy = function() {
                    re(AudioPlayerFlash.PLAYER_EL_ID)
                }
                ,
                t.prototype.onReady = function(t) {
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
                    var s = this;
                    renderFlash(AudioPlayerFlash.PLAYER_EL_ID, e, i, o) && setTimeout(function() {
                        s._checkFlashLoaded()
                    }, 50)
                }
                ,
                t.prototype.setUrl = function(t, e) {
                    return this._url == t ? void (e && e(!0)) : (this._url = t,
                    this._player && this._player.loadAudio(t),
                        void (e && e(!0)))
                }
                ,
                t.prototype.setVolume = function(t) {
                    this._player && this._player.setVolume && this._player.setVolume(t)
                }
                ,
                t.prototype.play = function() {
                    this._player && this._player.playAudio()
                }
                ,
                t.prototype.seek = function(t) {
                    var e = (this._total || 0) * t;
                    this._player && this._player.playAudio(e)
                }
                ,
                t.prototype.pause = function() {
                    this._player && this._player.pauseAudio()
                }
                ,
                t.prototype.isFullyLoaded = function() {
                    return !1
                }
                ,
                t.prototype.getPlayedTime = function() {
                    return 0
                }
                ,
                t.prototype.getCurrentProgress = function() {
                    return this._currProgress || 0
                }
                ,
                t.prototype.getCurrentBuffered = function() {
                    return this._currBuffered || 0
                }
                ,
                t.prototype.stop = function() {
                    this._player && this._player.stopAudio()
                }
                ,
                t.prototype._checkFlashLoaded = function() {
                    var t = ge("player");
                    if (this._checks = this._checks || 0,
                            this._checks++,
                        this._checks > 10) {
                        this._player = !1;
                        var e = this._onReady;
                        return e && e(!1)
                    }
                    if (t && t.paused) {
                        this._player = t;
                        var e = this._onReady;
                        e && e(!0),
                            this._onReady = null
                    } else {
                        var i = this;
                        setTimeout(function() {
                            i._checkFlashLoaded()
                        }, 100)
                    }
                }
                ,
                t.onAudioFinishCallback = function() {
                    var t = window._flashAudioInstance;
                    t.opts.onEnd && t.opts.onEnd()
                }
                ,
                t.onAudioProgressCallback = function(t, e) {
                    var i = window._flashAudioInstance;
                    e && (i._total = e,
                        i._currProgress = t / e,
                    i.opts.onProgressUpdate && i.opts.onProgressUpdate(i._currProgress))
                }
                ,
                t.onAudioLoadProgressCallback = function(t, e) {
                    var i = window._flashAudioInstance;
                    i._currBuffered = t / e,
                    i.opts.onBufferUpdate && i.opts.onBufferUpdate(i._currBuffered)
                }
                ,
                o(t, [{
                    key: "type",
                    get: function() {
                        return "flash"
                    }
                }]),
                t
        }();
        s.PLAYER_EL_ID = "flash_audio"
    },
    103: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        }
            : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol ? "symbol" : typeof t
        }
            , s = function() {
            function t(t, e) {
                for (var i = 0; i < e.length; i++) {
                    var o = e[i];
                    o.enumerable = o.enumerable || !1,
                        o.configurable = !0,
                    "value"in o && (o.writable = !0),
                        Object.defineProperty(t, o.key, o)
                }
            }
            return function(e, i, o) {
                return i && t(e.prototype, i),
                o && t(e, o),
                    e
            }
        }()
            , a = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
            , n = e.PlayerHTML5 = function() {
            function t(e) {
                i(this, t),
                    this.opts = e || {},
                    this._trackOptions = {},
                    this._audioNodes = [],
                    this._currentAudioEl = this._createAudioNode(),
                    this._prefetchAudioEl = this._createAudioNode()
            }
            return t.isSupported = function(t) {
                var e = "undefined" != typeof navigator ? navigator.userAgent : "";
                if (/(Windows NT 5.1|Windows XP)/.test(e) && (browser.vivaldi || browser.opera || browser.mozilla))
                    return !1;
                if (/(Windows 7|Windows NT 6.1)/.test(e) && (browser.vivaldi || browser.opera))
                    return !1;
                var i = document.createElement("audio");
                if (i.canPlayType) {
                    t = t || 'audio/mpeg; codecs="mp3"';
                    var o = i.canPlayType(t)
                        , s = o.replace(/no/, "");
                    return !!s
                }
                return !1
            }
                ,
                t.prototype.destroy = function() {}
                ,
                t.prototype.getPlayedTime = function() {
                    for (var t = this._currentAudioEl.played, e = 0, i = 0; i < t.length; i++)
                        e += t.end(i) - t.start(i);
                    return e
                }
                ,
                t.prototype._setAudioNodeUrl = function(t, e) {
                    window.data && data(t, "setUrlTimesetUrlTime", e == a ? 0 : vkNow()),
                        t.src = e
                }
                ,
                t.prototype._createAudioNode = function(t) {
                    var e = new Audio
                        , i = this;
                    return this.opts.onBufferUpdate && addEvent(e, "progress", function() {
                        i._currentAudioEl == e && i.opts.onBufferUpdate(i.getCurrentBuffered());
                        var t = e.buffered;
                        t.length;
                        1 == t.length && 0 == t.start(0) && t.end(0) == e.duration && (e._fullyLoaded = !0)
                    }),
                        addEvent(e, "stalled", function() {
                            i._currentAudioEl == e && i._isInvalidDuration() && i._currentAudioEl.currentTime >= i.duration - 1 && i._currentAudioEl.dispatchEvent(new Event("ended"))
                        }),
                    this.opts.onProgressUpdate && addEvent(e, "timeupdate", function() {
                        i._currentAudioEl == e && i.opts.onProgressUpdate(i.getCurrentProgress())
                    }),
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
                            i._prefetchAudioEl == e ? i._prefetchAudioEl = i._createAudioNode() : i._currentAudioEl == e && i.opts.onFail && i.opts.onFail()
                        }),
                        addEvent(e, "canplay", function() {
                            if (window.data) {
                                var t = data(e, "setUrlTime");
                                t && (cur.audioLoadTimings = cur.audioLoadTimings || [],
                                    cur.audioLoadTimings.push(vkNow() - t),
                                    data(e, "setUrlTime", 0))
                            }
                            i._prefetchAudioEl == e,
                            i._currentAudioEl == e && (i.opts.onCanPlay && i.opts.onCanPlay(),
                            i._seekOnReady && (i.seek(i._seekOnReady),
                                i._seekOnReady = !1))
                        }),
                    t && (this._setAudioNodeUrl(e, t),
                        e.preload = "auto",
                        e.volume = this._volume || 1,
                        e.load()),
                        this._audioNodes.push(e),
                        e
                }
                ,
                t.prototype.onReady = function(t) {
                    t(!0)
                }
                ,
                t.prototype.prefetch = function(t) {
                    this._prefetchAudioEl && this._setAudioNodeUrl(this._prefetchAudioEl, a),
                        this._prefetchAudioEl = this._createAudioNode(t)
                }
                ,
                t.prototype.seek = function(t) {
                    var e = this._currentAudioEl;
                    this.duration ? e.currentTime = this.duration * t : this._seekOnReady = t
                }
                ,
                t.prototype.setVolume = function(t) {
                    void 0 === t && (t = this._currentAudioEl.volume),
                        this._currentAudioEl.volume = t,
                    this._prefetchAudioEl && (this._prefetchAudioEl.volume = t),
                        this._volume = t
                }
                ,
                t.prototype._isInvalidDuration = function() {
                    var t = this._currentAudioEl;
                    return isNaN(t.duration) || t.duration == 1 / 0 || 0 == t.duration
                }
                ,
                t.prototype.getCurrentProgress = function() {
                    var t = this._currentAudioEl;
                    return this.duration ? Math.max(0, Math.min(1, t.currentTime / this.duration)) : 0
                }
                ,
                t.prototype.getCurrentBuffered = function() {
                    var t = this._currentAudioEl;
                    return t && t.buffered.length ? Math.min(1, t.buffered.end(0) / t.duration) : 0
                }
                ,
                t.prototype.isFullyLoaded = function() {
                    return this._currentAudioEl._fullyLoaded
                }
                ,
                t.prototype.setUrl = function(e, i) {
                    var s = this._currentAudioEl;
                    if (this._seekOnReady = !1,
                            this._trackOptions = {},
                        i && "object" === ("undefined" == typeof i ? "undefined" : o(i)) && (this._trackOptions = i,
                            i = i.callback),
                        s.src == e)
                        return this.opts.onCanPlay && this.opts.onCanPlay(),
                        i && i(!0);
                    if (this._prefetchAudioEl && this._prefetchAudioEl.readyState > t.STATE_HAVE_NOTHING)
                        if (this._prefetchAudioEl.src == e) {
                            this._currentAudioEl.pause(0),
                                this._setAudioNodeUrl(this._currentAudioEl, a);
                            var n = this;
                            this._prefetchAudioEl.readyState >= t.STATE_HAVE_FUTURE_DATA && setTimeout(function() {
                                n.opts.onCanPlay && n.opts.onCanPlay()
                            }),
                                s = this._currentAudioEl = this._prefetchAudioEl,
                                this._prefetchAudioEl = !1
                        } else
                            this._prefetchAudioEl.src && this._setAudioNodeUrl(this._prefetchAudioEl, a);
                    return s.src != e && (this._setAudioNodeUrl(s, e),
                        s.load()),
                    i && i(!0)
                }
                ,
                t.prototype.play = function(e) {
                    this._prefetchAudioEl.src == e && this._prefetchAudioEl.readyState > t.STATE_HAVE_NOTHING && (this._setAudioNodeUrl(this._currentAudioEl, a),
                        this._currentAudioEl = this._prefetchAudioEl,
                        this._prefetchAudioEl = this._createAudioNode(),
                    this.opts.onCanPlay && this.opts.onCanPlay());
                    var i = this._currentAudioEl;
                    if (i.src)
                        try {
                            i.play()
                        } catch (o) {
                            debugLog("Audio: url set failed (html5 impl)")
                        }
                }
                ,
                t.prototype.pause = function() {
                    var t = this._currentAudioEl;
                    t.src && t.pause()
                }
                ,
                t.prototype.stop = function() {
                    var t = this._currentAudioEl;
                    this._setAudioNodeUrl(t, a)
                }
                ,
                t.prototype._setFadeVolumeInterval = function(t) {
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
                            this._fadeVolumeWorker = null ),
                        this._fadeVolumeInterval && clearInterval(this._fadeVolumeInterval)
                }
                ,
                t.prototype.fadeVolume = function(t, e) {
                    t = Math.max(0, Math.min(1, t));
                    var i = this._currentAudioEl
                        , o = 0;
                    if (o = t < i.volume ? -.04 : .001,
                        Math.abs(t - i.volume) <= .001)
                        return this._setFadeVolumeInterval(),
                        e && e();
                    var s = i.volume;
                    this._setFadeVolumeInterval(function() {
                        o > 0 && (o *= 1.2),
                            s += o;
                        var i = !1;
                        return (i = 0 > o ? t >= s : s >= t) ? (this.setVolume(t),
                            this._setFadeVolumeInterval(),
                        e && e()) : void this.setVolume(s)
                    }
                        .bind(this))
                }
                ,
                s(t, [{
                    key: "type",
                    get: function() {
                        return "html5"
                    }
                }, {
                    key: "duration",
                    get: function() {
                        var t = this._currentAudioEl
                            , e = isNaN(t.duration) || t.duration == 1 / 0 ? 0 : t.duration;
                        return !e && this._trackOptions.duration && (e = parseInt(this._trackOptions.duration)),
                            e
                    }
                }]),
                t
        }();
        n.STATE_HAVE_NOTHING = 0,
            n.STATE_HAVE_FUTURE_DATA = 3,
            n.HAVE_ENOUGH_DATA = 4,
            n.AUDIO_EL_ID = "ap_audio"
    },
    104: function(t, e, i) {
        "use strict";
        function o(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        }),
            e.VoiceMessagePlayer = void 0;
        var s, a = function() {
            function t(t, e) {
                for (var i = 0; i < e.length; i++) {
                    var o = e[i];
                    o.enumerable = o.enumerable || !1,
                        o.configurable = !0,
                    "value"in o && (o.writable = !0),
                        Object.defineProperty(t, o.key, o)
                }
            }
            return function(e, i, o) {
                return i && t(e.prototype, i),
                o && t(e, o),
                    e
            }
        }(), n = i(103), r = i(102), u = i(130);
        var l = getAudioPlayer()._impl.musicBar.getVoiceMessageTemplate();
        e.VoiceMessagePlayer = function() {
            function t() {
                var e = this;
                o(this, t),
                    this._reattach = !1,
                    this._audioEl = null ,
                    this._playing = !1,
                    this._timer = null ,
                    this._duration = 0,
                    this._detaching = !1;
                var i = {
                    onEnd: function() {
                        e.detach()
                    },
                    onFail: function() {
                        i.onEnd()
                    },
                    onCanPlay: function() {},
                    onProgressUpdate: function(t) {
                        e._updateProgress(t)
                    }
                };
                s = !1,
                    n.PlayerHTML5.isSupported() ? (n.PlayerHTML5.isSupported('audio/ogg;codecs="opus"') && !n.PlayerHTML5.isSupported('audio/ogg;codecs="codec_check"') && (s = !0),
                        this._impl = new n.PlayerHTML5(i)) : browser.flash && window.renderFlash && (this._impl = new r.PlayerFlash(i)),
                    this.onPlayPause = function(t) {
                        return cancelEvent(t),
                            e.toggle()
                    }
                    ,
                    this.onDurationClick = function(t) {
                        e.durationType = !e.durationType,
                            cancelEvent(t)
                    }
                    ,
                    this._initEvents()
            }
            return t.prototype._updateProgress = function(t) {
                this.durationType ? this._durationEl.innerHTML = "-" + formatTime(Math.round(this._duration * (1 - t))) : this._durationEl.innerHTML = formatTime(Math.round(this._duration * t)),
                this._progressSlider && this._progressSlider.setValue(t)
            }
                ,
                t.prototype._initInterface = function() {
                    var t = this;

                    this._el = ce("div", {
                        innerHTML: l
                    }).firstChild,
                        attr(this._el, "aria-label", getLang("mail_audio_message")),
                        this._playBtn = geByClass1("audio-msg-track--btn", this._el),
                        attr(this._playBtn, "aria-label", getLang("global_audio_play")),
                        this._durationEl = geByClass1("audio-msg-track--duration", this._el),
                        this._durationEl.innerHTML = formatTime(this._duration),
                        this._progressSlider = new u.Slider(geByClass1("audio-msg-track--slider", this._el),{
                            value: 0,
                            size: 0,
                            hintClass: "audio_player_hint",
                            formatHint: function(e) {
                                return formatTime(Math.round(e * t._duration))
                            },
                            onEndDragging: function(e) {
                                t._impl.seek(e)
                            }
                        });
                    var e = geByClass1("audio-msg-track--wave-wrapper", this._audioEl).children[0];
                    geByClass1("slider_slide", this._el).appendChild(e.cloneNode(!0)),
                        geByClass1("slider_amount", this._el).appendChild(e.cloneNode(!0)),
                        addEvent(this._playBtn, "click", this.onPlayPause),
                        addEvent(this._durationEl, "click", this.onDurationClick),
                        domInsertAfter(this._el,this._audioEl);
                        //this._audioEl.parentNode.appendChild(this._el)
                }
                ,
                t.prototype._destroyInterface = function() {
                    hide(this._el),
                        this._audioEl.parentNode.removeChild(this._el),
                        removeEvent(this._playBtn, "click", this.onPlayPause),
                    this._progressSlider && (this._progressSlider.destroy(),
                        this._progressSlider = null ),
                        this._playBtn = null ,
                        this._durationEl = null ,
                        this._el = null
                }
                ,
                t.prototype.attachTo = function(t) {
                    if (this._audioEl != t) {
                        null != this._audioEl && (this._reattach = !0),
                            this.detach(),
                            this._audioEl = t,
                            addClass(this._audioEl, "audio-msg-track_player-attached"),
                            this._duration = attr(t, "data-duration"),
                            this._impl.setUrl(attr(t, s ? "data-ogg" : "data-mp3"), {
                                duration: this._duration
                            }),
                            this._initInterface();
                        var e = this._audioEl.id.split("_");
                        e && e.length > 1 && (this._owner_id = e[1]),
                            this._reattach = !1
                    }
                }
                ,
                t.prototype.detach = function() {
                    var t = arguments.length <= 0 || void 0 === arguments[0] ? !1 : arguments[0];
                    if (this._audioEl && this._el && !this._detaching) {
                        if (t && this.isAttached())
                            return;
                        this._detaching = !0,
                            this.stop(),
                            this._destroyInterface(),
                            removeClass(this._audioEl, "audio-msg-track_player-attached"),
                            this._audioEl = null
                    }
                    this._detaching = !1
                }
                ,
                t.prototype.play = function() {
                    this._audioEl && (this._reattach || t.pauseGlobalMedia(),
                        addClass(this._el, "audio-msg-track_playing"),
                        attr(this._playBtn, "aria-label", getLang("global_audio_pause")),
                        this._playing = !0,
                        this._createTimer(),
                    this._owner_id && statlogsValueEvent("audio_message_play", this._owner_id),
                        this._impl.play())
                }
                ,
                t.prototype.pause = function() {
                    this._audioEl && (!this._reattach && this._playing && t.resumeGlobalMedia(),
                        attr(this._playBtn, "aria-label", getLang("global_audio_play")),
                        removeClass(this._el, "audio-msg-track_playing"),
                        this._playing = !1,
                        this._impl.pause(),
                        this._killTimer())
                }
                ,
                t.prototype.stop = function() {
                    this.pause(),
                        this._impl.stop()
                }
                ,
                t.prototype.toggle = function() {
                    this._playing ? this.pause() : this.play()
                }
                ,
                t.prototype._createTimer = function() {
                    var t = this;
                    this._duration > 0 && (this._killTimer(),
                        this._timer = setInterval(function() {
                            var e = t._impl.getCurrentProgress();
                            t._updateProgress(e)
                        }, 100))
                }
                ,
                t.prototype._killTimer = function() {
                    this._timer && (clearInterval(this._timer),
                        this._timer = null )
                }
                ,
                t.prototype._initEvents = function() {
                    var t = this;
                    window.ap ? ap.on(this, AudioPlayer.EVENT_PLAY, function() {
                        delete ap.pausedByMsg,
                            t.pause()
                    }) : window.audio && audio.onPlay(function() {
                        delete audio.pausedByMsg,
                            t.pause()
                    }),
                    window.Notifier && (Notifier.addRecvClbk("audio_start", "audio_msg", function() {
                        t.pause()
                    }),
                        Notifier.addRecvClbk("video_start", "audio_msg", function() {
                            t.pause()
                        }))
                }
                ,
                t.prototype.isAttached = function() {
                    if (this._audioEl) {
                        for (var t = this._audioEl; t.parentNode; )
                            t = t.parentNode;
                        return !!t.body
                    }
                    return !1
                }
                ,
                t.pauseGlobalMedia = function() {
                    window.Notifier && Notifier.lcSend("video_start"),
                        window.ap && ap.isPlaying() ? (ap.pause(),
                            ap.pausedByMsg = !0) : window.audio && audio.playing && audio.playing() && (audio.pause(),
                            audio.pausedByMsg = !0)
                }
                ,
                t.resumeGlobalMedia = function() {
                    window.Notifier && Notifier.lcSend("video_hide"),
                        window.ap && ap.pausedByMsg ? (ap.play(),
                            delete ap.pausedByMsg) : window.audio && audio.playing && audio.pausedByMsg && (audio.play(),
                            delete audio.pausedByMsg)
                }
                ,
                a(t, [{
                    key: "durationType",
                    get: function() {
                        return window.AudioPlayer ? !!ls.get(AudioPlayer.LS_PREFIX + AudioPlayer.LS_DURATION_TYPE) : "1" == lsGet("audio_time_left")
                    },
                    set: function(t) {
                        window.AudioPlayer ? ls.set(AudioPlayer.LS_PREFIX + AudioPlayer.LS_DURATION_TYPE, !!t) : lsSet("audio_time_left", t ? "1" : "0")
                    }
                }]),
                t
        }()
    },
    130: function(t, e) {
        "use strict";
        function i(t, e) {
            if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function")
        }
        function o(t, e) {
            return Math.log(e) / Math.log(t)
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var s = function() {
            function t(t, e) {
                for (var i = 0; i < e.length; i++) {
                    var o = e[i];
                    o.enumerable = o.enumerable || !1,
                        o.configurable = !0,
                    "value"in o && (o.writable = !0),
                        Object.defineProperty(t, o.key, o)
                }
            }
            return function(e, i, o) {
                return i && t(e.prototype, i),
                o && t(e, o),
                    e
            }
        }()
            , a = 35;
        "undefined" == typeof window.isTouch && (window.isTouch = !1);
        e.Slider = function() {
            function t(e, o) {
                if (i(this, t),
                        !e)
                    throw new Error("No element was provided for Slider");
                e = ge(e),
                    this.options = o || {
                            size: 1
                        },
                "undefined" == typeof this.options.logfbase && (this.options.logfbase = a),
                    this.options.backValue = this.options.backValue || 0;
                var s = 100 * this.options.backValue
                    , n = this.options.withBackLine ? '<div class="slider_back" style="width:' + s + '%"></div>' : ""
                    , r = '<div class="slider_slide"><div class="slider_loading_bar" style="opacity: 0; display: none;"></div> ' + n + ' <div class="slider_amount"></div> <div class="slider_handler"></div> </div>';
                this._el = ce("div", {
                    innerHTML: r,
                    className: "slider",
                    id: e.getAttribute("id") || ""
                });
                var u = this;
                if (e.classList)
                    for (var l = e.classList, h = 0, d = l.length; d > h; h++)
                        addClass(this._el, l[h]);
                else
                    this._el.className = e.className;
                each(this._el.attributes, function(t, e) {
                    ("id" != e.name || "class" != e.name) && u._el.setAttribute(e.name, e.value)
                }),
                    e.parentNode.replaceChild(this._el, e),
                    this._amountEl = geByClass1("slider_amount", this._el),
                    this._handlerEl = geByClass1("slider_handler", this._el),
                    this._slideEl = geByClass1("slider_slide", this._el),
                    this._backEl = geByClass1("slider_back", this._el),
                    this._progressEl = geByClass1("slider_loading_bar", this._el),
                this.options.color && (setStyle(this._amountEl, {
                    backgroundColor: this.options.color
                }),
                    setStyle(this._handlerEl, {
                        backgroundColor: this.options.color
                    })),
                this.options.backColor && setStyle(this._slideEl, {
                    backgroundColor: this.options.backColor
                }),
                    addClass(this._el, "slider_size_" + this.options.size),
                this.options.debounce && (this._onValueChangeDebounced = debounce(this._onValueChange, this.options.debounce)),
                !isTouch && o.formatHint && (addEvent(this._el, "mousemove", this._ev_onMouseOver = this._onMouseOver.bind(this)),
                    addEvent(this._el, "mouseleave", this._ev_onMouseLeave = this._onMouseLeave.bind(this))),
                    addEvent(this._el, isTouch ? "touchstart" : "mousedown", this._ev_onMouseDown = this._onMouseDown.bind(this)),
                    addEvent(this._el, "click", cancelEvent),
                    this.setValue(this.options.value || 0, !this.options.fireChangeEventOnInit, !1),
                    this.setBackValue(this.options.backValue)
            }
            return t.prototype.toggleLoading = function(t) {
                t = !!t,
                    toggle(this._progressEl, t),
                    setStyle(this._progressEl, "opacity", t ? 1 : 0)
            }
                ,
                t.prototype.destroy = function() {
                    !isTouch && this.options.formatHint && (removeEvent(this._el, "mousemove", this._ev_onMouseOver),
                        removeEvent(this._el, "mouseleave", this._ev_onMouseLeave),
                        removeEvent(this._el, "mousedown", this._ev_onMouseDown));
                    var t = window.re || window.remove;
                    t(this._el),
                        t(this._currHintEl)
                }
                ,
                t.prototype._updateHint = function(t, e) {
                    this._currHintEl || (this._currHintEl = ce("div", {
                        className: "slider_hint",
                        id: "slider_hint"
                    }),
                    this.options.hintClass && addClass(this._currHintEl, this.options.hintClass),
                        this._el.appendChild(this._currHintEl));
                    var i = this._getPos()
                        , o = Math.round((t.pageX || t.touches[0].pageX) - i[0])
                        , s = this._width;
                    if (o = e ? Math.min(Math.max(0, o), s) : o,
                        o >= 0 && s >= o) {
                        var a = o / s;
                        this._currHintEl.innerHTML = this.options.formatHint ? this.options.formatHint.call(this, a) : a;
                        var n = this._currHintEl.getBoundingClientRect();
                        setStyle(this._currHintEl, {
                            left: this._slideEl.offsetLeft + o - (n.right - n.left) / 2,
                            top: this._slideEl.offsetTop - (n.bottom - n.top) - 10
                        }),
                        !e && this._toggleHint(!0)
                    } else
                        !e && this._toggleHint(!1);
                    this.options.formatHint || this._toggleHint(!1)
                }
                ,
                t.prototype._toggleHint = function(t) {
                    toggleClass(this._currHintEl, "visible", t)
                }
                ,
                t.prototype._onMouseOver = function(e) {
                    t._currenSliderDrag || hasClass(this._el, "active") || this._updateHint(e)
                }
                ,
                t.prototype._onMouseLeave = function(t) {
                    hasClass(this._el, "active") || this._toggleHint(!1)
                }
                ,
                t.prototype._onMouseDown = function(e) {
                    (0 == e.button || e.touches) && (delete cur._sliderMouseUpNowEl,
                        addEvent(window, isTouch ? "touchmove" : "mousemove", this._ev_onMouseMove = this._onMouseMove.bind(this)),
                        addEvent(window, isTouch ? "touchend touchcancel" : "mouseup", this._ev_onMouseUp = this._onMouseUp.bind(this)),
                        this._onMouseMove(e),
                        t._currenSliderDrag = this,
                        addClass(this._el, "active"),
                        cancelEvent(e))
                }
                ,
                t.prototype._onMouseUp = function(e) {
                    cur._sliderMouseUpNowEl = this._el,
                        removeEvent(window, isTouch ? "touchmove" : "mousemove", this._ev_onMouseMove),
                        removeEvent(window, isTouch ? "touchend touchcancel" : "mouseup", this._ev_onMouseUp),
                        this._onValueChange(),
                        removeClass(this._el, "active"),
                        t._currenSliderDrag = !1,
                        this._toggleHint(!1),
                    this.options.onEndDragging && this.options.onEndDragging(this._currValue),
                        cancelEvent(e)
                }
                ,
                t.prototype._onMouseMove = function(t) {
                    var e = this._getPos()
                        , i = e[0];
                    i = "undefined" != typeof t.touches && t.touches.length > 0 ? t.touches[0].pageX : t.pageX,
                        i = Math.max(i, e[0]),
                        i = Math.min(i, e[0] + this._width),
                        i -= e[0],
                        this.setValue(i / this._width, !0, !0),
                        this._onValueChangeDebounced ? this._onValueChangeDebounced() : this._onValueChange(),
                        this._toggleHint(!0),
                        this._updateHint(t, !0),
                        cancelEvent(t)
                }
                ,
                t.prototype._getPos = function() {
                    return this._slidePos = getXY(this._slideEl)
                }
                ,
                t.prototype._logf = function(t) {
                    if (!this.options.log)
                        return t;
                    var e = this.options.logfbase;
                    return (Math.pow(e, t) - 1) / (e - 1)
                }
                ,
                t.prototype._unlogf = function(t) {
                    if (!this.options.log)
                        return t;
                    var e = this.options.logfbase;
                    return o(e, 1 + t * (e - 1))
                }
                ,
                t.prototype.setValue = function(t, e, i) {
                    if (!hasClass(this._el, "active") || i) {
                        var o = i ? this._logf(t) : t;
                        if (this._currValue != o) {
                            this._currValue = o;
                            var s = i ? t : this._unlogf(t);
                            s = 100 * s + "%",
                                setStyle(this._amountEl, {
                                    width: s
                                }),
                                setStyle(this._handlerEl, {
                                    left: s
                                }),
                            !e && this._onValueChange()
                        }
                    }
                }
                ,
                t.prototype.setBackValue = function(t) {
                    toggleClass(this._backEl, "slider_back_transition", t > this._backValue),
                        this._backValue = t;
                    var e = 100 * t + "%";
                    setStyle(this._backEl, {
                        width: e
                    })
                }
                ,
                t.prototype._onValueChange = function() {
                    this._lastValue = this._lastValue || 0,
                    this._lastValue != this._currValue && (this._lastValue = this._currValue,
                    this.options.onChange && this.options.onChange(this._currValue))
                }
                ,
                s(t, [{
                    key: "_width",
                    get: function() {
                        if (!this._widthCache) {
                            var t = this._el.getBoundingClientRect();
                            this._widthCache = t.right - t.left
                        }
                        return this._widthCache
                    }
                }]),
                t
        }()
    },
    137: function(t, e, i) {
        "use strict";
        function o(t) {
            for (var e = geByClass("audio-msg-track--wave-wrapper", t), i = 0, o = 0; o < e.length; o++) {
                try {
                    i = parseInt(window.getComputedStyle(e[o], null ).getPropertyValue("width"))
                } catch (s) {
                    i = parseInt(e[o].currentStyle.width)
                }
                if (i > 0)
                    break
            }
            return i
        }
        function s(t, e) {
            e = Math.round(e),
            t.length != e && (t = (0,
                u.fastResample)(t, e));
            for (var i = "", o = 0, s = 0; s < t.length; s++)
                o = Math.floor(10 * t[s] * .95),
                0 == o && (o = .5),
                    i += "M" + (3 * s + 1) + "," + (10 - o) + "v" + 2 * o + "Z";
            return '<svg class="audio-msg-track--wave" width="' + 3 * t.length + 'px"><path d="' + i + '"></path></svg>'
        }
        function a() {
            for (var t = geByClass("audio-msg-track"), e = 0; e < t.length; e++) {
                var i = attr(t[e], "data-wave");
                hasClass(t[e], "audio-msg-player") && e > 0 && (i = attr(t[e - 1], "data-wave"));
                var a = o(t[e]);
                if (i && a) {
                    i = i.split(",");
                    for (var n = geByClass("audio-msg-track--wave", t[e]), r = s(i, a / 3), u = 0; u < n.length; u++) {
                        var l = ce("div", {
                            innerHTML: r
                        }).firstChild;
                        n[u].parentNode.replaceChild(l, n[u])
                    }
                }
            }
        }
        function n() {
            return l || (l = new r.VoiceMessagePlayer),
                l
        }
        var r = i(104)
            , u = i(32)
            , l = null ;
        addEvent(window, "orientationchange", function() {
            return setTimeout(a, 500)
        }),
        window.mail && window.mail.onMessagesRepainted && (onDOMReady(a),
            mail.onMessagesRepainted(a)),
            window.AudioMessagePlayer = {
                loaded: !0,
                togglePlay: function(t, e) {
                    var i = n();
                    i.attachTo(t),
                        i.play()
                },
                detachPlayer: function(t) {
                    var e = n();
                    e.detach(t)
                },
                pauseGlobalMedia: function() {
                    r.VoiceMessagePlayer.pauseGlobalMedia()
                },
                resumeGlobalMedia: function() {
                    r.VoiceMessagePlayer.resumeGlobalMedia()
                },
                redrawWaves: a,
                getWave: s
            };
        try {
            stManager.done("voice_message_player.js")
        } catch (h) {}
    }
});
