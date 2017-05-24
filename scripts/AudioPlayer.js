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
}({
    0: function(t, e, i) {
        t.exports = i(80)
    },
    61: function(module, exports) {
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
                AudioLayer.prototype.toggle = function(t, e) {
                    var i = this;
                    this._initTooltip();
                    var o = this._els.tt
                        , a = void 0 !== t ? t : !o.isShown();
                    a ? (o.show(),
                        cancelStackPush("top_audio", function() {
                            i.toggle(!1, !0)
                        }, !0)) : (e || cancelStackPop(),
                        o.hide()),
                        toggleClass(this._els.topNotaBtn, "active", a)
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
                        o = -i + (a[0] - t[0]) + 15
                    } else {
                        var s = getXY(this._els.topPlayBtn);
                        o = -i + (s[0] - t[0]) + 3
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
    },
    62: function(t, e) {
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
    },
    80: function(module, exports, __webpack_require__) {
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
                        is_loading_all: 1,
                        claim: intval(nav.objLoc.claim)
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
                    e = e || 0;
                    var i = Math.max(0, Math.ceil(o / AUDIO_LOAD_CHUNK_SIZE));
                    if (0 >= i - e)
                        t();
                    else
                        for (var a = new callHub(t,i - e), s = e; i > s; s++)
                            r(s, function() {
                                a.done()
                            })
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
        var _slicedToArray = function() {
            function t(t, e) {
                var i = []
                    , o = !0
                    , a = !1
                    , s = void 0;
                try {
                    for (var r, l = t[Symbol.iterator](); !(o = (r = l.next()).done) && (i.push(r.value),
                    !e || i.length !== e); o = !0)
                        ;
                } catch (n) {
                    a = !0,
                        s = n
                } finally {
                    try {
                        !o && l["return"] && l["return"]()
                    } finally {
                        if (a)
                            throw s
                    }
                }
                return i
            }
            return function(e, i) {
                if (Array.isArray(e))
                    return e;
                if (Symbol.iterator in Object(e))
                    return t(e, i);
                throw new TypeError("Invalid attempt to destructure non-iterable instance")
            }
        }()
            , _audio_unmask_source = __webpack_require__(62)
            , _audio_layer = __webpack_require__(61)
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
                contextSplit: function(t) {
                    return (t || "").split(":")
                },
                showAudioPlaylist: function(t, e, i, o, a) {
                    return cur.apLayer ? cancelEvent(a) : (boxRefreshCoords(boxLoader),
                        show(boxLoader),
                        show(boxLayerWrap),
                        stManager.add("auto_list.js", function() {
                            function a(t) {
                                boxQueue.hideAll(),
                                cur.apLayerAutoList && (cur.apLayerAutoList.destroy(),
                                    cur.apLayerAutoList = null),
                                    layers.wraphide(window.audioPlaylistLayerWrap),
                                    layers.fullhide = !1,
                                l && removeEvent(window.audioPlaylistLayerWrap, "click", l),
                                n && removeEvent(bodyNode, "keydown", n),
                                    delete cur.apLayer,
                                    delete cur.apLayerPlaylistId,
                                    removeClass(layerBG, "ap_layer_bg_dark"),
                                    nav.change({
                                        z: !1
                                    }),
                                    layerQueue.pop()
                            }
                            function s(s, r) {
                                if (hide(boxLoader),
                                        hide(boxLayerWrap),
                                        r) {
                                    var u = getLang("audio_error_deleted_playlist_box").split("/");
                                    return void new MessageBox({
                                        title: u[0]
                                    }).content(u[1]).setButtons(getLang("global_close"), function() {
                                        curBox().hide()
                                    }).show()
                                }
                                var d = extend(nav.objLoc, {
                                    z: "audio_playlist" + t + "_" + e + (i ? "/" + i : "")
                                });
                                nav.setLoc(d),
                                window.audioPlaylistLayerWrap || (window.audioPlaylistLayerWrap = se('<div class="ap_layer_wrap"></div>'),
                                    bodyNode.appendChild(window.audioPlaylistLayerWrap)),
                                    window.audioPlaylistLayerWrap.innerHTML = "";
                                var _ = s.getAudiosList().length
                                    , c = getTemplate("audio_playlist_snippet", {
                                    title: s.getTitle(),
                                    description: s.getDescription(),
                                    coverStyle: s.getCoverUrl() ? "background-image:url(" + s.getCoverUrl() + "); background-size: cover;" : "",
                                    authorLine: s.getAuthorLine(),
                                    infoLine1: s.getInfoLine1(),
                                    infoLine2: s.getInfoLine2(),
                                    id: s.getPlaylistId(),
                                    ownerId: s.getOwnerId(),
                                    href: "/audio?z=audio_playlist_" + s.getOwnerId() + "_" + s.getPlaylistId() + "/" + s.getAccessHash(),
                                    addCls: s.getAddClasses(),
                                    followHash: s.getFollowHash(),
                                    accessHash: s.getAccessHash(),
                                    editHash: s.getEditHash(),
                                    gridCovers: s.getGridCovers(),
                                    context: o,
                                    followButtonText: s.isFollowed() ? getLang("audio_playlist_btn_followed") : getLang("audio_playlist_btn_follow")
                                });
                                cur.apLayer = se('<div class="ap_layer"><div class="ap_layer__content">' + c + '</div><div class="ap_layer__close _ap_layer__close"></div></div>'),
                                    window.audioPlaylistLayerWrap.appendChild(cur.apLayer),
                                    addEvent(window.audioPlaylistLayerWrap, "click", l = function(t) {
                                            (t.target == window.audioPlaylistLayerWrap || t.target == geByClass1("_ap_layer__close", cur.apLayer)) && layers.fullhide()
                                        }
                                    ),
                                    addEvent(bodyNode, "keydown", n = function(t) {
                                            return 27 == t.keyCode ? (layers.fullhide(),
                                                cancelEvent(t)) : void 0
                                        }
                                    ),
                                    layerQueue.push(),
                                    layerQueue.hide(),
                                    boxQueue.hideAll(),
                                    layers.wrapshow(window.audioPlaylistLayerWrap, .7),
                                    addClass(layerBG, "ap_layer_bg_dark");
                                var y = geByClass1("_audio_pl_snippet__list", cur.apLayer);
                                _ && (cur.apLayerAutoList = new AutoList(y,{
                                    scrollNode: window.audioPlaylistLayerWrap,
                                    onNeedRows: function(t, e) {
                                        for (var i = [], o = s.getUnshuffledAudiosList(), a = e; e + 30 > a && o[a]; a++)
                                            i.push(AudioUtils.drawAudio(o[a], "inlined"));
                                        t(i)
                                    }
                                })),
                                    setStyle(y, {}),
                                    boxRefreshCoords(cur.apLayer),
                                    getAudioPlayer().updateCurrentPlaying(),
                                    layers.fullhide = a,
                                    cur.apLayerPlaylistId = [t, e]
                            }
                            var r = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_PLAYLIST, t, e, i);
                            r.loadAll(s);
                            var l, n
                        }),
                        !1)
                },
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
                toggleAudioHQBodyClass: function() {
                    var t = getAudioPlayer().showHQLabel();
                    toggleClass(document.body, AudioUtils.AUDIO_HQ_LABEL_CLS, t)
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
                                    var t = getAudioPlayer().getPlaylist(AudioPlaylist.TYPE_PLAYLIST, r ? -r : vk.id, AudioPlaylist.DEFAULT_PLAYLIST_ID);
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
                    var l = "";
                    if (t[AudioUtils.AUDIO_ITEM_INDEX_COVER_URL]) {
                        var n = t[AudioUtils.AUDIO_ITEM_INDEX_COVER_URL].split(",");
                        l = "background-image: url(" + n[0] + ")"
                    }
                    var u = formatTime(t[AudioUtils.AUDIO_ITEM_INDEX_DURATION])
                        , d = t[AudioUtils.AUDIO_ITEM_INDEX_PERFORMER].replace(/<\/?em>/g, "")
                        , _ = clean(JSON.stringify(t)).split("$").join("$$")
                        , c = getTemplate("audio_row", t);
                    return c = c.replace(/%cls%/, a.join(" ")),
                        c = c.replace(/%duration%/, u),
                        c = c.replace(/%serialized%/, _),
                        c = c.replace(/%cover_style%/, l),
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
                    var i, o = getAudioPlayer(), a = AudioUtils.getAudioFromEl(t, !0), s = null, r = [], l = domData(t, "new-post"), n = !1, u = null, d = AudioPlaylist.TYPE_TEMP, _ = vk.id, c = {}, y = [], h = t, A = window.AudioPage && currentAudioPage(t), p = window.traverseParent || function(t, e) {
                                for (t = ge(t); t && !e(t) && (t = domPN(t),
                                t != document); )
                                    ;
                                return null
                            }
                        ;
                    p(t, function(t) {
                        return n = domData(t, "audio-context")
                    }),
                        n = a.context || n,
                        n = n || ("audio" == cur.module ? cur.submodule : cur.module);
                    var f = AudioUtils.contextSplit(n)
                        , g = _slicedToArray(f, 2)
                        , P = g[0]
                        , E = g[1]
                        , v = gpeByClass("_audio_pl", t);
                    if (v) {
                        var m = (domData(v, "playlist-id") || "").split("_");
                        u = o.getPlaylist.apply(o, m);
                        var I = domData(v, "title") || "";
                        I && u.mergeWith({
                            title: I
                        });
                        var T = domData(v, "access-hash") || "";
                        for (T && u.mergeWith({
                            accessHash: T
                        }); h = domPN(h); )
                            y.push((h.id ? "#" + h.id : "") + (h.className ? "." + h.className : ""));
                        y = y.slice(0, 30),
                            y = y.filter(function(t) {
                                return !!trim(t)
                            }),
                            y = y.reverse().join(" / "),
                            y = document.location.href + " : " + y
                    } else if (A && A.getPageCurrentPlaylist())
                        u = A.getPageCurrentPlaylist();
                    else if ("module" == P) {
                        var L = E;
                        u = o.getPlaylist(AudioPlaylist.TYPE_PLAYLIST, L || cur.oid || vk.id, AudioPlaylist.DEFAULT_PLAYLIST_ID),
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
                        d = AudioPlaylist.TYPE_WALL,
                            i = a.context;
                        var C = a.context.replace("post", "").split("_");
                        _ = C[0],
                            c = {
                                postId: C[1]
                            }
                    } else if (0 === a.context.indexOf("choose"))
                        i = a.context;
                    else if ("feed" == l || 0 === a.context.indexOf("feed") || 0 === a.context.indexOf("feedsearch"))
                        i = "feed",
                            r = e(geByClass("wall_text", s));
                    else if ("group_wall" == P || "user_wall" == P || 0 === a.context.indexOf("reply") || "wall" == l) {
                        d = AudioPlaylist.TYPE_WALL,
                            _ = cur.oid;
                        var C = (E || "").split("_")[1]
                            , w = cur.wallQuery || ""
                            , S = ge("wall_search")
                            , D = inArray(cur.wallType, ["own", "full_own"]) ? "own" : "all";
                        i = hashCode(D + "_" + w),
                        "wall" == cur.module && val(S) && (w = val(S)),
                        C && (c = {
                            postId: C,
                            wallQuery: w,
                            wallType: D
                        });
                        var U = 0 === a.context.indexOf("reply");
                        U && (r = e([gpeByClass("_replies_list", t)]),
                            i = "reply" + i),
                            r = r.concat(e([s]))
                    } else {
                        for (; h = domPN(h); )
                            y.push((h.id ? "#" + h.id : "") + (h.className ? "." + h.className : ""));
                        y = y.slice(0, 30),
                            y = y.filter(function(t) {
                                return !!trim(t)
                            }),
                            y = y.reverse().join(" / "),
                            y = document.location.href + " : " + y
                    }
                    return s || (s = domPN(t)),
                        r = r.filter(function(t) {
                            return !!t
                        }),
                    r && 0 != r.length || (r = [s]),
                        u = u ? u : o.getPlaylist(d, _, i),
                        u = u.getAudiosCount() ? u : AudioUtils.initDomPlaylist(u, r),
                        u.mergeWith(c || {}),
                    -1 == u.indexOfAudio(a) && (u = AudioUtils.initDomPlaylist(u, [domPN(t)])),
                        {
                            playlist: u,
                            context: n
                        }
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
            AudioPlaylist.TYPE_SEARCH = "search",
            AudioPlaylist.TYPE_FEED = "feed",
            AudioPlaylist.TYPE_LIVE = "live",
            AudioPlaylist.TYPE_WALL = "wall",
            AudioPlaylist.TYPE_RECENT = "recent",
            AudioPlaylist.DEFAULT_PLAYLIST_ID = -1,
            AudioPlaylist.prototype.serialize = function() {
                var t = {}
                    , e = getAudioPlayer().getCurrentAudio()
                    , i = Math.max(0, this.indexOfAudio(e));
                return t.list = clone(this.getAudiosList().slice(Math.max(0, i - 100), i + 300), !0),
                    each(t.list, function(t, e) {
                        e[AudioUtils.AUDIO_ITEM_INDEX_URL] = ""
                    }),
                    t.type = AudioPlaylist.TYPE_TEMP,
                    t.ownerId = vk.id,
                    t.albumId = irand(1, 999),
                    t.hasMore = !1,
                    t.title = this.getTitle(),
                    t.context = getAudioPlayer()._getPlayingContext(),
                    t.originalPlaylistRawId = this.getOriginalPlaylistRawId(),
                this.getType() == AudioPlaylist.TYPE_PLAYLIST && this.getAlbumId() > 0 && (t.originalPlaylistRawId = this.getOwnerId() + "_" + this.getAlbumId() + "_" + this.getAccessHash()),
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
                    params.hasMore = !1,
                        delete params.ownerId,
                        delete this._ref,
                        this._type = AudioPlaylist.TYPE_TEMP,
                        this._ownerId = params.ownerId || vk.id,
                        this._albumId = AudioPlaylist.plIndex++,
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
            AudioPlaylist.prototype.getOriginalPlaylistRawId = function() {
                return this.getSelf()._originalPlaylistRawId
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
                var t = getAudioPlayer().getCurrentAudio()
                    , e = this.getSelf()
                    , i = this.indexOfAudio(t);
                -1 != i && (e._list.splice(i, 1),
                    e._list.unshift(t),
                    e._movedAudioToFirstPos = i)
            }
            ,
            AudioPlaylist.prototype._resetMovedAudioToInitialPosition = function() {
                var t = this.getSelf();
                if (t._movedAudioToFirstPos) {
                    var e = t._list.splice(0, 1);
                    t._list.splice(t._movedAudioToFirstPos, 0, e[0]),
                        delete t._movedAudioToFirstPos
                }
            }
            ,
            AudioPlaylist.prototype.clean = function(t) {
                t || this._unref();
                var e = this.getSelf();
                e._hasMore = !0,
                    e._list = [],
                    e._items = [],
                    e._feedOffset = e._feedFrom = 0,
                    e._nextOffset = 0
            }
            ,
            AudioPlaylist.prototype.shuffle = function(t) {
                if (!(this.isShuffled() && t || !this.isShuffled() && !t)) {
                    var e = this.getSelf();
                    if (t) {
                        var i = !1;
                        if (this.hasMore())
                            if (this.getType() == AudioPlaylist.TYPE_SEARCH)
                                e._originalList = [].concat(e._list),
                                    shuffle(e._list),
                                    this._moveCurrentAudioAtFirstPosition(),
                                    i = !0;
                            else if (inArray(this.getType(), [AudioPlaylist.TYPE_RECOM])) {
                                var o = getAudioPlayer().getCurrentAudio()
                                    , a = this.indexOfAudio(o);
                                this.clean(!0),
                                a >= 0 && e.addAudio(o, 0),
                                    i = !0
                            } else
                                this._unref(),
                                    e._originalList = [].concat(e._list),
                                    shuffle(e._list),
                                    this._moveCurrentAudioAtFirstPosition(),
                                    i = !0;
                        else
                            e._originalList = [].concat(e._list),
                                shuffle(e._list),
                                this._moveCurrentAudioAtFirstPosition(),
                                i = !0;
                        i && (e._shuffle = t)
                    } else
                        e._originalList ? e._list = e._originalList : this.clean(!0),
                            delete e._shuffle,
                            delete e._originalList,
                            delete e._shuffle;
                    return !0
                }
            }
            ,
            AudioPlaylist.prototype.getNextOffset = function() {
                return this.getSelf()._nextOffset || this.getAudiosCount()
            }
            ,
            AudioPlaylist.prototype.getAudiosList = function() {
                return this.getSelf()._list || []
            }
            ,
            AudioPlaylist.prototype.getUnshuffledAudiosList = function() {
                var t = this.getSelf()
                    , e = void 0;
                return e = t._originalList ? t._originalList : t._list
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
                for (var i = this.getSelf(), o = i._list, a = 0, s = o.length; s > a; a++)
                    if (e[0] == o[a][AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] && e[1] == o[a][AudioUtils.AUDIO_ITEM_INDEX_ID])
                        return a;
                return -1
            }
            ,
            AudioPlaylist.prototype.getAudio = function(t) {
                isString(t) ? t : AudioUtils.asObject(t).fullId;
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
                        this._statusExport = {},
                        this._currentPlayingRows = [],
                        this._allowPrefetchNext = !1,
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
            }
            ,
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
                        this._repeatCurrent ? (this._implSeekImmediate(0),
                            this._implPlay()) : (this._isPlaying = !1,
                            this.notify(AudioPlayer.EVENT_PAUSE),
                            this.notify(AudioPlayer.EVENT_ENDED),
                            this.playNext(!0)),
                            this._sendListenedData()
                    }
                }
                    .bind(this)
                    , a = 0
                    , s = []
                    , r = void 0
                    , l = this
                    , n = {
                    onBufferUpdate: function(t) {
                        this.notify(AudioPlayer.EVENT_BUFFERED, t)
                    }
                        .bind(this),
                    onEnd: function() {
                        a = 0,
                            o()
                    },
                    onFail: function() {
                        var t = AudioUtils.asObject(l.getCurrentAudio());
                        t && (s.push(t.fullId),
                            clearTimeout(r),
                            r = setTimeout(function() {
                                if (s.length) {
                                    var t = s.join(",");
                                    ajax.post("al_audio.php", {
                                        act: "failed_urls",
                                        audios: t
                                    }),
                                        s = []
                                }
                            }, 3e3)),
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
                    t ? this._impl = new AudioPlayerHTML5(n) : AudioPlayerHTML5WebAudio.isSupported() ? this._impl = new AudioPlayerHTML5WebAudio(n) : AudioPlayerHTML5.isSupported() ? this._impl = new AudioPlayerHTML5(n) : browser.flash && (this._impl = new AudioPlayerFlash(n)),
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
                this.getCurrentPlaylist();
                if (e)
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
            }
            ,
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
                    n.getType() == AudioPlaylist.TYPE_PLAYLIST ? u = geByClass("_audio_pl_" + n.getOwnerId() + "_" + n.getPlaylistId()) : "recoms1" == n.getAlbumId() && (u = geByClass("_recoms_special_recoms")),
                    u && each(u, function() {
                        addClass(this, "audio_pl__playing")
                    })
                }
            }
            ,
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
                if (t)
                    return t = AudioUtils.asObject(t),
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
                        })
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
                var t = this._lsGet("tns_triggered_time_v3") || 0
                    , e = 864e5;
                vkNow() - t < e || (this._lsSet("tns_triggered_time_v3", vkNow()),
                    vkImage().src = "http://www.tns-counter.ru/V13a****mail_ru/ru/CP1251/tmsec=mail_audiostart/" + irand(1, 1e9))
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
                        this._currentPlaylist = new AudioPlaylist(t),
                        this._initPlayingContext(t.context),
                    t.originalPlaylistRawId && (this._currentPlaylist._originalPlaylistRawId = t.originalPlaylistRawId)),
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
            var s = this.hasPlaylist(t, e, i);
            return s ? (s.mergeWith({
                accessHash: o
            }),
                s) : new AudioPlaylist({
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
                } else {
                    var u = AudioUtils.getContextPlaylist(i);
                    this.play(o, u.playlist, u.context)
                }
                var d = window.AudioPage && currentAudioPage(i);
                if (d) {
                    var _ = d.getPageCurrentPlaylist();
                    d.onUserAction(a, _)
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
            var a = this.getCurrentAudio()
                , s = AudioUtils.asObject(a);
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
                            var r = this.getCurrentPlaylist()
                                , l = this._impl.getCurrentProgress();
                            if (this._lsSet(AudioPlayer.LS_PROGRESS, l),
                                    this._trackListenedData(s, r, o, this._getPlayingContext()),
                                this._allowPrefetchNext && l >= .8) {
                                var n = r.getNextAudio(a);
                                n && this._impl.isFullyLoaded() && (this._allowPrefetchNext = !1,
                                    this._prefetchAudio(n))
                            }
                        }
                        break;
                    case AudioPlayer.EVENT_PAUSE:
                        this._setTabIcon("pause")
                }
        }
        ,
        AudioPlayer.prototype._trackListenedData = function(t, e, i, o) {
            var a = this;
            if (i = Math.round(i) || 0) {
                var s = {
                    audio_id: AudioUtils.asObject(t).fullId,
                    listened: i,
                    context: o
                };
                e && e.getType() == AudioPlaylist.TYPE_PLAYLIST && (s.playlist_id = e.getOwnerId() + "_" + e.getAlbumId() + (e.getAccessHash() ? "_" + e.getAccessHash() : "")),
                    this._currentAudioListenData = s,
                    clearTimeout(this._sendListenedTO),
                    this._sendListenedTO = setTimeout(function() {
                        a._sendListenedData()
                    }, 1e4)
            }
        }
        ,
        AudioPlayer.prototype._sendListenedData = function() {
            var t = this;
            clearTimeout(this._sendListenedTO);
            var e = this._currentAudioListenData;
            if (this._currentAudioListenData = !1,
                e && e.listened && this._listenedHash) {
                var i = extend({
                    act: "listened_data",
                    impl: this._impl.type,
                    hash: this._listenedHash,
                    v: 5,
                    tr: window.traverseParent ? 1 : 0,
                    loc: nav.strLoc
                }, e);
                isArray(cur.audioLoadTimings) && (i.timings = cur.audioLoadTimings.join(","),
                    cur.audioLoadTimings = []),
                    ajax.post("al_audio.php", i, {
                        onDone: function(e) {
                            t._adsConfig = e
                        }
                    })
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
                onDone: function(t, e, a) {
                    i.mergeWith({
                        title: e.title,
                        list: [t]
                    }),
                        o.play(t, i, a)
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
                        setCookie("remixcurr_audio", t[AudioUtils.AUDIO_ITEM_INDEX_OWNER_ID] + "_" + t[AudioUtils.AUDIO_ITEM_INDEX_ID], 1);
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
                    onDone: function(i, a, s) {
                        getAudioPlayer().setStatusExportInfo(a),
                            n._listenedHash = s,
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
            var a = cur.cancelClick || e && (hasClass(e.target, "audio_lyrics") || domClosest("_audio_duration_wrap", e.target) || domClosest("_audio_inline_player", e.target) || domClosest("audio_performer", e.target));
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
                    return void (hasClass(i, "no_actions") || showAudioClaimWarning(s.ownerId, s.id, l.id, s.title, l.reason))
            }
            var n = hasClass(i, AudioUtils.AUDIO_PLAYING_CLS);
            if (n)
                this.pause();
            else {
                var u = AudioUtils.getContextPlaylist(i);
                this.play(s.fullId, u.playlist, s.context || u.context),
                cur.audioPage && cur.audioPage.onUserAction(s, u.playlist)
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
                var i = this._getPlayingContextSection();
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
            a && a.getId() == s.getId() && this.isPlaying() ? this.pause() : (s.load(function() {
                var t = s.getAudioAt(0);
                t && this.play(t, s, o)
            }
                .bind(this)),
            s.getAudiosCount() && this.play(audio, s, o))
        }
        ,
        AudioPlayer.prototype._initPlayingContext = function(t) {
            this._playingContext = t
        }
        ,
        AudioPlayer.prototype._getPlayingContext = function() {
            return this._playingContext || ""
        }
        ,
        AudioPlayer.prototype._getPlayingContextSection = function() {
            return this._getPlayingContext().split(":")[0]
        }
        ,
        AudioPlayer.prototype.play = function(t, e, i, o, a) {
            if (!cur.loggingOff) {
                if (!this._impl)
                    return void AudioUtils.showNeedFlashBox();
                this._cleanUpPlaylists(),
                (isObject(t) || isArray(t)) && (t = AudioUtils.asObject(t),
                t && (t = t.fullId));
                var s = AudioUtils.asObject(this._currentAudio)
                    , r = this.getCurrentPlaylist();
                !t && s && (t = s.fullId);
                var l = !1
                    , n = t && s && t == s.fullId;
                e ? r && (l = e == r.getSelf() || e == r) : (e = r,
                    l = !0),
                l || i || debugLog("New playlist play init without context"),
                i && this._initPlayingContext(i);
                var u = e.getAudio(t);
                u && e.load(e.indexOfAudio(u) + 3),
                n || this._sendListenedData(),
                n || this._adsIsAdPlaying() || this._adsDeinit(),
                    n && l ? this._adsIsAdPlaying() ? this._adsResumeAd() : this.isPlaying() || (this._isPlaying = !0,
                        this._sendLCNotification(),
                        this.notify(AudioPlayer.EVENT_PLAY),
                    n || this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                        this._implClearAllTasks(),
                        this._implSetVolume(0),
                        this._implSetUrl(u),
                        this._implPlay(),
                        this._implSetVolume(this.getVolume(), !0)) : t && u && (this._currentAudio = u,
                    l || (this._currentPlaylist && (this._prevPlaylist = this._currentPlaylist,
                        this._prevAudio = this._currentAudio),
                        this._currentPlaylist = new AudioPlaylist(e),
                        this.notify(AudioPlayer.EVENT_PLAYLIST_CHANGED)),
                        this._isPlaying = !0,
                        this.updateCurrentPlaying(!0),
                        this._adsIsAdPlaying() ? (this.notify(AudioPlayer.EVENT_PLAY, !0),
                            this._adsResumeAd()) : (this._sendLCNotification(),
                            this.notify(AudioPlayer.EVENT_PLAY, !0, intval(o), a),
                            this.notify(AudioPlayer.EVENT_PROGRESS, 0),
                            this._muteProgressEvents = !0,
                            this._implClearAllTasks(),
                            a ? this._startAdsPlay(u, e, !1, function() {
                                u = this.getCurrentAudio(),
                                u && this.isPlaying() && (this.notify(AudioPlayer.EVENT_UPDATE),
                                    this._implSetUrl(u),
                                    this._implPlay(),
                                    this._implSetVolume(this.getVolume()),
                                    this._triggerTNSPixel())
                            }
                                .bind(this)) : (this._implSetVolume(0, !0),
                                this._implPause(),
                                this._startAdsPlay(u, e, !0, function() {
                                    u = this.getCurrentAudio(),
                                    u && this.isPlaying() && (this.notify(AudioPlayer.EVENT_UPDATE),
                                        this._implSetUrl(u),
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
                        s ? this.play(s, a, !1, 1, e) : a.isLive() ? (this._muteProgressEvents = !0,
                            a.fetchNextLiveAudio(function(t) {
                                this.play(t, a, !1, 1, e)
                            }
                                .bind(this))) : (s = a.getAudioAt(0),
                            this.play(s, a, !1, 1, e))
                    } else {
                        var r = a.indexOfAudio(this._currentAudio) - 1;
                        if (0 > r)
                            this.seek(0);
                        else {
                            for (var l = a.getAudioAt(r); i && l && AudioUtils.isClaimedAudio(l); )
                                l = a.getAudioAt(--r),
                                    i--;
                            this.play(l, a, !1, -1, e)
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
            return i ? i.enabled ? inArray(this._getPlayingContextSection(), i.sections) ? i.day_limit_reached ? AudioPlayer.ADS_ALLOW_REJECT : AudioPlayer.ADS_ALLOW_ALLOWED : AudioPlayer.ADS_ALLOW_REJECT : AudioPlayer.ADS_ALLOW_DISABLED : AudioPlayer.ADS_ALLOW_REJECT
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
                    my_playlists: 101,
                    audio_feed: 109,
                    recent: 113,
                    user_wall: 104,
                    group_wall: 104,
                    user_list: 102,
                    group_list: 103,
                    user_playlists: 102,
                    group_playlists: 103,
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
            this._opts = t,
                this._audio = new Audio,
                this._audio.crossOrigin = "anonymous",
                "AudioContext"in window ? this._context = new AudioContext : "webkitAudioContext"in window && (this._context = new webkitAudioContext),
                this._context.suspend(),
                this._toggleContext(!1),
                this._analyser = this._context.createAnalyser(),
                this._gainNode = this._context.createGain(),
                this._analyser.connect(this._gainNode),
                this._gainNode.connect(this._context.destination),
                this.type = "html5webapi"
        }
        ,
        AudioPlayerHTML5WebAudio.isSupported = function() {
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
            }) : this._audio._canPlay ? (e(o.play()),
                this._startFreqAnalyse()) : (this._audio.onCanPlays = this._audio.onCanPlays || [],
                this._audio.onCanPlays.push(function() {
                    e(o.play()),
                        i._startFreqAnalyse()
                }))
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
            }, 50)
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
                    AudioUtils.debugLog("HTML5 error track loading"),
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
});
