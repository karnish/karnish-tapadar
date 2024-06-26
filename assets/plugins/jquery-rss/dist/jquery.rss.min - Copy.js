(function(c) {
    var e = function(a, b, d, f) {
        this.target = a;
        this.url = b;
        this.html = [];
        this.effectQueue = [];
        this.options = c.extend({
            ssl: !1,
            limit: null,
            key: null,
            layoutTemplate: "<ul>{entries}</ul>",
            entryTemplate: '<li><a href="{url}">[{author}@{date}] {title}</a><br/>{shortBodyPlain}</li>',
            tokens: {},
            outputMode: "json",
            effect: "show",
            error: function() {
                console.log("jQuery RSS: url doesn't link to RSS-Feed")
            },
            success: function() {}
        }, d || {});
        this.callback = f || this.options.success
    };
    e.htmlTags = "doctype,html,head,title,base,link,meta,style,script,noscript,body,article,nav,aside,section,header,footer,h1-h6,hgroup,address,p,hr,pre,blockquote,ol,ul,li,dl,dt,dd,figure,figcaption,div,table,caption,thead,tbody,tfoot,tr,th,td,col,colgroup,form,fieldset,legend,label,input,button,select,datalist,optgroup,option,textarea,keygen,output,progress,meter,details,summary,command,menu,del,ins,img,iframe,embed,object,param,video,audio,source,canvas,track,map,area,a,em,strong,i,b,u,s,small,abbr,q,cite,dfn,sub,sup,time,code,kbd,samp,var,mark,bdi,bdo,ruby,rt,rp,span,br,wbr".split(",");
    e.prototype.load = function(a) {
        var b = "http" + (this.options.ssl ? "s" : "") + "://ajax.googleapis.com/ajax/services/feed/load?v=1.0&output=" + this.options.outputMode + "&callback=?&q=" + encodeURIComponent(this.url);
        null != this.options.limit && (b += "&num=" + this.options.limit);
        null != this.options.key && (b += "&key=" + this.options.key);
        c.getJSON(b, a)
    };
    e.prototype.render = function() {
        var a = this;
        this.load(function(b) {
            try {
                a.feed = b.responseData.feed, a.entries = b.responseData.feed.entries
            } catch (d) {
                return a.entries = [], a.feed = null,
                    a.options.error.call(a)
            }
            b = a.generateHTMLForEntries();
            a.target.append(b.layout);
            0 !== b.entries.length && a.appendEntriesAndApplyEffects(c("entries", b.layout), b.entries);
            0 < a.effectQueue.length ? a.executeEffectQueue(a.callback) : c.isFunction(a.callback) && a.callback.call(a)
        })
    };
    e.prototype.appendEntriesAndApplyEffects = function(a, b) {
        var d = this;
        c.each(b, function(b, e) {
            var c = d.wrapContent(e);
            "show" === d.options.effect ? a.before(c) : (c.css({
                display: "none"
            }), a.before(c), d.applyEffect(c, d.options.effect))
        });
        a.remove()
    };
    e.prototype.generateHTMLForEntries = function() {
        var a = this,
            b = {
                entries: [],
                layout: null
            };
        c(this.entries).each(function() {
            if (a.isRelevant(this)) {
                var d = a.evaluateStringForEntry(a.options.entryTemplate, this);
                b.entries.push(d)
            }
        });
        b.layout = this.options.entryTemplate ? this.wrapContent(this.options.layoutTemplate.replace("{entries}", "<entries></entries>")) : this.wrapContent("<div><entries></entries></div>");
        return b
    };
    e.prototype.wrapContent = function(a) {
        return 0 !== c.trim(a).indexOf("<") ? c("<div>" + a + "</div>") : c(a)
    };
    e.prototype.applyEffect = function(a, b, d) {
        switch (b) {
            case "slide":
                a.slideDown("slow", d);
                break;
            case "slideFast":
                a.slideDown(d);
                break;
            case "slideSynced":
                this.effectQueue.push({
                    element: a,
                    effect: "slide"
                });
                break;
            case "slideFastSynced":
                this.effectQueue.push({
                    element: a,
                    effect: "slideFast"
                })
        }
    };
    e.prototype.executeEffectQueue = function(a) {
        var b = this;
        this.effectQueue.reverse();
        var d = function() {
            var f = b.effectQueue.pop();
            f ? b.applyEffect(f.element, f.effect, d) : a && a()
        };
        d()
    };
    e.prototype.evaluateStringForEntry = function(a,
        b) {
        var d = a,
            f = this;
        c(a.match(/(\{.*?\})/g)).each(function() {
            var a = this.toString();
            d = d.replace(a, f.getValueForToken(a, b))
        });
        return d
    };
    e.prototype.isRelevant = function(a) {
        var b = this.getTokenMap(a);
        return this.options.filter ? this.options.filterLimit && this.options.filterLimit == this.html.length ? !1 : this.options.filter(a, b) : !0
    };
    e.prototype.getTokenMap = function(a) {
        if (!this.feedTokens) {
            var b = JSON.parse(JSON.stringify(this.feed));
            delete b.entries;
            this.feedTokens = b
        }
        return c.extend({
            feed: this.feedTokens,
            url: a.link,
            author: a.author,
            date: a.publishedDate,
            title: a.title,
            body: a.content,
            shortBody: a.contentSnippet,
            bodyPlain: function(a) {
                for (var a = a.content.replace(/<script[\\r\\\s\S]*<\/script>/mgi, "").replace(/<\/?[^>]+>/gi, ""), b = 0; b < e.htmlTags.length; b++) a = a.replace(RegExp("<" + e.htmlTags[b], "gi"), "");
                return a
            }(a),
            shortBodyPlain: a.contentSnippet.replace(/<\/?[^>]+>/gi, ""),
            index: c.inArray(a, this.entries),
            totalEntries: this.entries.length,
            teaserImage: function(a) {
                try {
                    return a.content.match(/(<img.*?>)/gi)[0]
                } catch (b) {
                    return ""
                }
            }(a),
            teaserImageUrl: function(a) {
                try {
                    return a.content.match(/(<img.*?>)/gi)[0].match(/src="(.*?)"/)[1]
                } catch (b) {
                    return ""
                }
            }(a)
        }, this.options.tokens)
    };
    e.prototype.getValueForToken = function(a, b) {
        var d = this.getTokenMap(b),
            c = a.replace(/[\{\}]/g, ""),
            c = d[c];
        if ("undefined" != typeof c) return "function" == typeof c ? c(b, d) : c;
        throw Error("Unknown token: " + a);
    };
    c.fn.rss = function(a, b, c) {
        (new e(this, a, b, c)).render();
        return this
    }
})(jQuery);