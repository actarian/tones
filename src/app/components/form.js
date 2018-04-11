/* global window, document, console, TweenLite */

(function () {
    'use strict';

    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var formMultiple = document.querySelector('.form-group-multiple');

    function onMultiple() {
        formMultiple.addClass('active');
    }

    function onDown(e) {
        if (!e.target.isDescendant(formMultiple)) {
            formMultiple.removeClass('active');
        }
    }
    formMultiple.addEventListener('mousedown', onMultiple);
    formMultiple.addEventListener('touchstart', onMultiple);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('touchstart', onDown);

    var navContainer = document.querySelector('.nav-container');
    Scrollbar.use(window.OverscrollPlugin);
    Scrollbar.init(navContainer, {
        plugins: {
            overscroll: {},
        },
    });

    var options = Array.prototype.slice.call(document.querySelectorAll('.nav-multiple li'));

    function setValue() {
        var brands = options.filter(function (item) {
            return item.active;
        }).map(function (item) {
            return item.querySelector('span').innerHTML;
        });
        var input = document.querySelector('input[name="Brands"]');
        input.value = brands.length > 0 ? brands.join(', ') : null;
        console.log('setValue', brands, input.value);
        // console.log('setValue', input.value, input);
    }

    options.filter(function (option, index) {
        function onToggle(e) {
            option.active = !option.active;
            if (option.active) {
                option.addClass('active');
            } else {
                option.removeClass('active');
            }
            setValue();
        }

        function onMouseToggle(e) {
            option.removeEventListener('touchstart', onTouchToggle);
            onToggle(e);
        }

        function onTouchToggle(e) {
            option.removeEventListener('mousedown', onMouseToggle);
            onToggle(e);
        }
        option.addEventListener('mousedown', onMouseToggle);
        option.addEventListener('touchstart', onTouchToggle);
    });

}());