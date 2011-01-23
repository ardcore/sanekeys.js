var sanekeys = (function(g, undefined) {

    var watched = {},
        pressed = {},
        lastKeyPress = -Infinity,
        lastKeyUp = -Infinity,
        lastKeyDown = -Infinity,
        watching = false,
        keyTable = {},
        revKeyTable = {},
        handlers = {};

    // generate keyTable
    (function() {

        // letters:
        var i = 0,
            ck;

        while (ck = "abcdefghijklmnopqrstuvwxyz".charAt(i)) {
            keyTable["" + (65 + i)] = ck;
            i++;
        }

        // numbers
        for (i = 0; i < 10; i++) {
            keyTable["" + (48 + i)] = "" + i;
        }

        // arrows
        keyTable["37"] = "left";
        keyTable["38"] = "up";
        keyTable["39"] = "right";
        keyTable["40"] = "down";

        // meta
        keyTable["16"] = "shift";
        keyTable["17"] = "ctrl";
        keyTable["18"] = "alt";

        // special
        keyTable["13"] = "enter";
        keyTable["8"] = "backspace";
        keyTable["27"] = "esc";

        // generate reversed keyTable
        for (var k in keyTable) {
            revKeyTable[ keyTable[k] ] = k;
        }
    })();

    var getKeyCodeFromChar = function(ch) {
        return revKeyTable[ch] || undefined;
    };

    var getCharFromKeyCode = function(keyCode) {
        return keyTable[keyCode] || undefined;
    };

    var KeyWatcher = function(callbacks) {
        var self = this;
        callbacks.keyDown = callbacks.keyDown || function() {};
        callbacks.keyUp = callbacks.keyUp || function() {};
        callbacks.keyPress = callbacks.keyPress || function() {};

        self.triggerKeyDown = function(e) {
            callbacks.keyDown.call(null, e);
            lastKeyDown = (new Date()).getTime();
        };

        self.triggerKeyUp = function(e) {
            callbacks.keyUp.call(null, e);
            lastKeyUp = (new Date()).getTime();
        };

        self.triggerKeyPress = function(e) {
            callbacks.keyPress.call(null, e);
            lastKeyPress = (new Date()).getTime();
        };

        self.override = function(eventName, callback) {
            if ("keyDown keyUp keyPress".indexOf(eventName) != -1) {
                callbacks[eventName] = callback;
            } else {
                err("incorrect event as override: " + eventName);
            }
        }
    };

    function startWatching() {
        g.addEventListener("keydown", handlers.h_keyDown, false);
        g.addEventListener("keyup", handlers.h_keyUp, false);
        g.addEventListener("keypress", handlers.h_keyPress, false);
    }

    function setKeysDiverted(keys, suffix) {
        var keyWatcherOpt,
            keyBundle,
            handleBundle;

        keyBundle = "key" + suffix;
        handleBundle = "h_" + keyBundle;

        for (var key in keys) {
            if (key in revKeyTable) {
                var keyCode = getKeyCodeFromChar(key);
                if (!watched[keyCode]) {
                    keyWatcherOpt = {};
                    keyWatcherOpt[keyBundle] = keys[key];
                    watched[keyCode] = new KeyWatcher(keyWatcherOpt);
                } else {
                    watched[keyCode].override(keyBundle, keys[key])
                }
                if (!watching) {
                    watching = true;
                    startWatching();
                }
            } else {
                err("dont know anything about " + key);
            }
        }
    };

    function err(err) {
        throw new Error(err)
    }

    handlers = {
        h_keyDown: function(e) {
            pressed[e.keyCode] = true;
            if (watched[e.keyCode]) {
                watched[e.keyCode].triggerKeyDown(e);
            }
        },

        h_keyUp: function(e) {
            pressed[e.keyCode] = false;
            if (watched[e.keyCode]) {
                watched[e.keyCode].triggerKeyUp(e);
            }
        },

        h_keyPress: function(e) {
            var normalizedCode;
            if (e.charCode && e.charCode >= 65 && e.charCode <= 126) {
                normalizedCode = e.charCode - 32;
            } else {
                normalizedCode = e.charCode;
            }
            if (watched[normalizedCode]) {
                watched[normalizedCode].triggerKeyPress(e);
            }
        }
    };

    return {
        watchKey: function(key, callbacks) {
            var keyCode = getKeyCodeFromChar(key.toLowerCase());
            if (!watched[keyCode]) {
                watched[keyCode] = new KeyWatcher(callbacks);
            }
            if (!watching) {
                watching = true;
                startWatching();
            }
        },


        setKeysDown: function(keys) {
            setKeysDiverted.call(null, keys, "Down");
        },
        setKeysPress: function(keys) {
            setKeysDiverted.call(null, keys, "Press");
        },
        setKeysUp: function(keys) {
            setKeysDiverted.call(null, keys, "Up");
        },

        setKeys: function(keys) {
            setKeysDiverted.call(null, keys, "Down")
        },

        isPressed: function(key) {
            return !!pressed[getKeyCodeFromChar(key)];
        },

        getTimeFromLastDawn: function(key) { // needs better name ;-)
            return (new Date()).getTime() - lastKeyDown;
        },
        getTimeFromLastUp: function(key) { // needs better name ;-)
            return (new Date()).getTime() - lastKeyUp;
        },
        getTimeFromLastPress: function(key) { // needs better name ;-)
            return (new Date()).getTime() - lastKeyPress;
        }

    }
}(this))
