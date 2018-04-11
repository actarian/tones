/* global window, document, console, Tone, TweenLite */

(function () {
    'use strict';

    var volume = new Tone.Volume(-100);
    var synth = getSynth(volume);

    var song = getSong();

    var connectors = [];
    var hittables = [];

    var camera, scene, renderer, orbit, drag;
    var geometry, material, mesh;

    var cube, cube2;

    init();
    animate();

    function init() {
        // scene
        scene = new THREE.Scene();

        // camera
        // camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
        camera.position.set(0, 20, 40);
        camera.lookAt(0, 0, 0);
        scene.add(camera);

        // box
        geometry = new THREE.BoxGeometry(10, 10, 10);
        material = new THREE.MeshNormalMaterial();
        cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        connectors.push(cube);

        // sphrer
        geometry = new THREE.BoxGeometry(3, 3, 3);
        material = new THREE.MeshNormalMaterial();
        cube2 = new THREE.Mesh(geometry, material);
        cube2.position.set(0, -20, 0);
        scene.add(cube2);
        hittables.push(cube2);

        // renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector('.section-scene').appendChild(renderer.domElement);

        // controls
        orbit = new THREE.OrbitControls(camera);
        orbit.update();

        drag = new THREE.DragControls(hittables, camera, renderer.domElement);
        drag.addEventListener('dragstart', function (e) {
            orbit.enabled = false;
            song.start();
            song.theremin.start();
        });
        drag.addEventListener('drag', function (e) {
            var a = cube2.position.clone();
            var b = cube.position.clone();
            var d = a.sub(b).addScalar(12).divideScalar(24);
            song.theremin.drag(d.z, d.x);
            TweenLite.to(song, 0.5, {
                speed: 1,
                ease: Power2.easeOut,
                onUpdate: function () {
                    song.setSpeed(song.speed);
                },
            });
        });
        drag.addEventListener('dragend', function (e) {
            orbit.enabled = true;
            TweenLite.to(song, 0.5, {
                speed: 0,
                ease: Power2.easeOut,
                onUpdate: function () {
                    song.setSpeed(song.speed);
                },
                onComplete: function () {
                    song.theremin.stop();
                    song.stop();
                },
            });
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.03 * song.speed;
        cube.rotation.y += 0.06 * song.speed;
        // collisions();
        renderer.render(scene, camera);
    }

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function collisions() {
        connectors.filter(function (c, i) {
            c.on = false;
            var origin = c.position.clone();
            for (var v = 0; v < c.geometry.vertices.length; v++) {
                var local = c.geometry.vertices[v].clone();
                var global = local.applyMatrix4(c.matrix);
                var direction = global.sub(c.position);
                var ray = new THREE.Raycaster(origin, direction.clone().normalize());
                var results = ray.intersectObjects(hittables);
                if (results.length > 0 && results[0].distance < direction.length()) {
                    c.volume = results[0].object.position.distanceTo(origin) / direction.length();
                    c.on = true;
                }
            }
            if (c.on) {
                volume.set('volume', -100 + 100 * c.volume);
                synth.triggerAttack('C4');
            } else {
                synth.triggerRelease();
            }
        });
    }

    function getSynth(volume) {
        var synth = new Tone.Synth({
            oscillator: {
                type: 'amtriangle',
                harmonicity: 0.5,
                modulationType: 'sine'
            },
            envelope: {
                attackCurve: 'exponential',
                attack: 0.05,
                decay: 0.2,
                sustain: 0.2,
                release: 1.5,
            },
            portamento: 0.05
        });

        /*
        var delay = new Tone.PingPongDelay({
            delayTime: '2t',
            feedback: 0.4,
            wet: 0.25
        });
        delay.chain(volume, Tone.Master);
        synth.connect(delay);
        */

        synth.chain(volume, Tone.Master);
        //play a middle 'C' for the duration of an 8th note
        // synth.triggerAttackRelease('C4', '8n');
        return synth;
    }

    function getSong() {
        // COMPRESSOR
        var compressor = new Tone.Compressor({
            threshold: -30,
            ratio: 6,
            attack: 0.3,
            release: 0.1
        }).toMaster();

        // DISTORTION
        var distortion = new Tone.Distortion({
            distortion: 0.4,
            wet: 0.4
        });

        // HATS
        var hats = new Tone.Player({
            url: 'audio/505/hh.[mp3|ogg]',
            volume: -10,
            retrigger: true,
            fadeOut: 0.05
        }).chain(distortion, compressor);
        hats.loop = new Tone.Loop({
            callback: function (time) {
                hats.start(time).stop(time + 0.05);
            },
            interval: '16n',
            probability: 0.8
        }).start('1m');

        // SNARE
        var snare = new Tone.Player({
            url: 'audio/505/snare.[mp3|ogg]',
            retrigger: true,
            fadeOut: 0.1
        }).chain(distortion, compressor);
        snare.part = new Tone.Sequence(function (time, velocity) {
            snare.volume.value = Tone.gainToDb(velocity);
            snare.start(time).stop(time + 0.1);
        }, [null, 1, null, [1, 0.3]]).start(0);

        // KICK
        var kick = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            octaves: 6,
            oscillator: {
                type: 'square4'
            },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0
            }
        }).connect(compressor);
        kick.part = new Tone.Sequence(function (time, probability) {
            if (Math.random() < probability) {
                kick.triggerAttack('C1', time);
            }
        }, [1, [1, [null, 0.3]], 1, [1, [null, 0.5]], 1, 1, 1, [1, [null, 0.8]]], '2n').start(0);

        // BASS
        var bass = new Tone.FMSynth({
            harmonicity: 1,
            modulationIndex: 3.5,
            carrier: {
                oscillator: {
                    type: 'custom',
                    partials: [0, 1, 0, 2]
                },
                envelope: {
                    attack: 0.08,
                    decay: 0.3,
                    sustain: 0,
                },
            },
            modulator: {
                oscillator: {
                    type: 'square'
                },
                envelope: {
                    attack: 0.1,
                    decay: 0.2,
                    sustain: 0.3,
                    release: 0.01
                },
            }
        }).toMaster();
        bass.part = new Tone.Part(function (time, event) {
            if (Math.random() < event.prob) {
                bass.triggerAttackRelease(event.note, event.dur, time);
            }
        }, [{
            time: '0:0',
            note: 'C2',
            dur: '4n.',
            prob: 1
        }, {
            time: '0:2',
            note: 'C2',
            dur: '8n',
            prob: 0.6
        }, {
            time: '0:2.6666',
            note: 'C2',
            dur: '8n',
            prob: 0.4
        }, {
            time: '0:3.33333',
            note: 'C2',
            dur: '8n',
            prob: 0.9
        }, {
            time: '1:0',
            note: 'C2',
            dur: '4n.',
            prob: 1
        }, {
            time: '1:2',
            note: 'C2',
            dur: '8n',
            prob: 0.6
        }, {
            time: '1:2.6666',
            note: 'C2',
            dur: '8n',
            prob: 0.4
        }, {
            time: '1:3.33333',
            note: 'E2',
            dur: '8n',
            prob: 0.9
        }, {
            time: '2:0',
            note: 'F2',
            dur: '4n.',
            prob: 1
        }, {
            time: '2:2',
            note: 'F2',
            dur: '8n',
            prob: 0.6
        }, {
            time: '2:2.6666',
            note: 'F2',
            dur: '8n',
            prob: 0.4
        }, {
            time: '2:3.33333',
            note: 'F2',
            dur: '8n',
            prob: 0.9
        }, {
            time: '3:0',
            note: 'F2',
            dur: '4n.',
            prob: 1
        }, {
            time: '3:2',
            note: 'F2',
            dur: '8n',
            prob: 0.6
        }, {
            time: '3:2.6666',
            note: 'F2',
            dur: '8n',
            prob: 0.4
        }, {
            time: '3:3.33333',
            note: 'B1',
            dur: '8n',
            prob: 0.9
        }]).start(0);
        bass.part.loop = true;
        bass.part.loopEnd = '4m';

        // SYNTH
        var synth = new Tone.DuoSynth({
            vibratoAmount: 0.5,
            vibratoRate: 5,
            portamento: 0.1,
            harmonicity: 1.005,
            volume: 5,
            voice0: {
                volume: -2,
                oscillator: {
                    type: 'sawtooth'
                },
                filter: {
                    Q: 1,
                    type: 'lowpass',
                    rolloff: -24
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.25,
                    sustain: 0.4,
                    release: 1.2
                },
                filterEnvelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0.3,
                    release: 2,
                    baseFrequency: 100,
                    octaves: 4
                }
            },
            voice1: {
                volume: -10,
                oscillator: {
                    type: 'sawtooth'
                },
                filter: {
                    Q: 2,
                    type: 'bandpass',
                    rolloff: -12
                },
                envelope: {
                    attack: 0.25,
                    decay: 4,
                    sustain: 0.1,
                    release: 0.8
                },
                filterEnvelope: {
                    attack: 0.05,
                    decay: 0.05,
                    sustain: 0.7,
                    release: 2,
                    baseFrequency: 5000,
                    octaves: -1.5
                }
            }
        }).toMaster();
        synth.notes = ['C2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'G4', 'A4', 'B4', 'C5'];
        synth.note = synth.notes[0];

        Tone.Transport.bpm.value = 1;

        var song = {
            effects: {
                compressor: compressor,
                distortion: distortion,
            },
            instruments: {
                hats: hats,
                snare: snare,
                kick: kick,
                bass: bass,
                synth: synth,
            },
            start: function () {
                Tone.Transport.start('+0.1');
            },
            stop: function () {
                Tone.Transport.stop();
            },
            theremin: {
                drag: function (x, y) {
                    x = Math.max(0, Math.min(1, x));
                    y = Math.max(0, Math.min(1, y));
                    var note = synth.notes[Math.round(x * synth.notes.length - 1)];
                    if (synth.note !== note) {
                        synth.note = note;
                        synth.setNote(note);
                    }
                    synth.vibratoAmount.value = y * 2;
                },
                start: function () {
                    synth.triggerAttack(synth.note);
                },
                stop: function () {
                    synth.triggerRelease();
                },
            },
            speed: 0,
            setSpeed: function (x) {
                x = Math.max(0, Math.min(1, x));
                Tone.Transport.bpm.value = 1 + Math.round(x * 124);
            },
        };
        return song;
    }

    /*

    var raycaster = new THREE.Raycaster();
    var down;

    function getTouch(e) {
        return new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    }

    function onDown(e) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        down = getTouch(e);
        // down.x = (e.clientX / renderer.domElement.offsetWidth) * 2 - 1;
        // down.y = -(e.clientY / renderer.domElement.offsetHeight) * 2 + 1;
        raycaster.setFromCamera(down, camera);
        var hitted = raycaster.intersectObjects(hittables);
        // console.log(hitted.length, down.x, down.y);
        if (hitted.length) {
            if (orbit) {
                orbit.enabled = false;
            }
            var index = hittables.indexOf(hitted[0].object);
            down.index = index;
            down.rotation = connectors[index].inner.rotation.clone();
            // connectors[index].inner.position.x = 10;
            connectors[index].flip();
        } else {
            down = null;
        }
    }

    function onMove(e) {
        if (down) {
            var move = getTouch(e);
            var diff = move.sub(down);
            var index = down.index;
            var rotation = connectors[index].inner.rotation;
            rotation.x = down.rotation.x + diff.y;
            // console.log('rotation.x', rotation.x);
        }
    }

    function onUp(e) {
        down = null;
        if (orbit) {
            orbit.enabled = true;
        }
    }

    function onAdd() {
        addElement();
    }

    function onRemove() {
        removeElement();
    }

    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    */
    window.addEventListener('resize', resize, false);

}());