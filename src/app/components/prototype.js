/* global window, document, console  */

(function () {
    'use strict';

    Element.prototype.hasClass = function (name) {
        return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(this.className);
    };

    Element.prototype.addClass = function (name) {
        if (!this.hasClass(name)) {
            this.className = this.className ? (this.className + ' ' + name) : name;
        }
    };

    Element.prototype.removeClass = function (name) {
        if (this.hasClass(name)) {
            this.className = this.className.split(name).join('').replace(/\s\s+/g, ' '); // .replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
        }
    };

    Element.prototype.isDescendant = function (target) {
        function isDescendant(node, target) {
            if (node === target) {
                return true;
            } else if (node.parentNode) {
                return isDescendant(node.parentNode, target);
            } else {
                return false;
            }
        }
        return isDescendant(this, target);
    };

    window.getMouse = function (e) {
        var y = 0.0;
        if (e.touches) {
            y = e.touches[0].pageY;
        } else {
            y = e.clientY;
        }
        var x = 0.0;
        if (e.touches) {
            x = e.touches[0].pageX;
        } else {
            x = e.clientX;
        }
        var mouse = {
            x: x,
            y: y
        };
        // console.log('getMouse', mouse);
        return mouse;
    };

}());