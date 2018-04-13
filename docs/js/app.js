/* global window, document, console, TweenLite, Tone */

(function () {
    'use strict';

    var Song = function () {

        var volume = new Tone.Volume(-100);

        function Song() {}

        Song.getMp3 = getMp3;
        Song.getSong = getSong;
        Song.getSynth = getSynth;

        function getMp3() {

            // FILTER
            var filter = new Tone.Filter({
                type: 'lowpass',
                frequency: 350,
                rolloff: -12,
                Q: 1,
                gain: 0
            }).toMaster();

            var player = new Tone.Player({
                url: "audio/The-Blinding-Shiver-128.[mp3|ogg]",
                loop: true,
                playbackRate: 0.1,
            }).toMaster().sync().start('0');

            Tone.Transport.timeSignature = 4;
            Tone.Transport.bpm.value = 98;
            Tone.Transport.loop = true;
            Tone.Transport.loopStart = '0';
            Tone.Transport.loopEnd = '98:5';

            // SYNTH
            var synth = new Tone.DuoSynth({
                vibratoAmount: 0.5,
                vibratoRate: 5,
                portamento: 0.1,
                harmonicity: 1.005,
                volume: 1,
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

            var song = {
                effects: {
                    filter: filter,
                },
                instruments: {
                    player: player,
                    synth: synth,
                },
                start: function () {
                    Tone.Transport.start("+0.1");
                },
                stop: function () {
                    Tone.Transport.pause();
                },
                theremin: {
                    drag: function (d) {
                        d = d.divideScalar(10);
                        var x = Math.abs(d.x);
                        var y = Math.abs(d.z);
                        x = Math.max(0, Math.min(1, x));
                        y = Math.max(0, Math.min(1, y));
                        var i = Math.max(0, Math.min(synth.notes.length - 1, Math.round(y * synth.notes.length - 1)));
                        var note = synth.notes[synth.notes.length - 1 - i];
                        if (synth.note !== note) {
                            synth.note = note;
                            synth.setNote(note);
                        }
                        synth.vibratoAmount.value = x * 10;
                        if (song.speed === 1) {
                            filter.set('detune', -10000 + (20000 * x));
                        }
                        // console.log(song.speed);
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
                    player.set('playbackRate', 0.1 + 0.99 * x);
                    filter.set('detune', -10000 + (10000 * x));
                },
            };
            return song;

        }

        function getSong() {

            // FILTER
            var filter = new Tone.Filter({
                type: 'lowpass',
                frequency: 350,
                rolloff: -12,
                Q: 1,
                gain: 0
            }).toMaster();

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
                    filter: filter,
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
                    drag: function (d) {
                        d = d.divideScalar(10);
                        var x = Math.abs(d.x);
                        var y = Math.abs(d.z);
                        x = Math.max(0, Math.min(1, x));
                        y = Math.max(0, Math.min(1, y));
                        var i = Math.max(0, Math.min(synth.notes.length - 1, Math.round(y * synth.notes.length - 1)));
                        var note = synth.notes[synth.notes.length - 1 - i];
                        if (synth.note !== note) {
                            synth.note = note;
                            synth.setNote(note);
                        }
                        synth.vibratoAmount.value = x * 10;
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
                    filter.set('detune', -10000 + (10000 * x));
                },
            };
            return song;
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

        return Song;

    }();

    window.Song = Song;

}());
/* global window, document, console, Tone, TweenLite, stats */

(function () {
    'use strict';

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var container = document.querySelector('.section-scene');

    var song = Song.getMp3();
    // var song = Song.getSong();
    var synth = null;
    // var volume = new Tone.Volume(-100);
    // var synth = Song.getSynth(volume);

    var DEBUG = false;
    var SHOW_RING = true;
    var USE_PCSS_SHADOWS = false;
    var SHADOW_SIZE = 1024; // 2048;
    var T = 0;
    var textureTypes = {
        DIFFUSE: 0,
        BUMP: 1,
        LIGHT: 2,
        ALPHA: 3,
    };

    var RAD = Math.PI / 180;

    function rad(degree) {
        return degree * RAD;
    }

    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    var statsdom = stats.dom;
    statsdom.setAttribute('class', 'stats');
    // statsdom.style.cssText = 'position:fixed;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000';
    if (DEBUG) {
        container.appendChild(stats.dom);
    }

    var performance = (window.performance || Date);
    var ticks = [],
        fps, dragging;

    var connectors = [];
    var hittables = [];

    var camera, perspectivecamera, orthocamera, scene, renderer, orbit, drag;
    var light;
    var geometry, material, mesh;
    var group, plane, connector, emitter, ring, cover, disc, label;

    var envMap, bumpMap, diffuseMap, roughnessMap, metalnessMap;

    bumpMap = getDiscTextures(textureTypes.BUMP);
    roughnessMap = getDiscTextures(textureTypes.LIGHT, 512);
    diffuseMap = getDiscTextures(textureTypes.DIFFUSE, 512);
    metalnessMap = getDiscTextures(textureTypes.LIGHT, 512);

    // soft shadow maps         
    if (USE_PCSS_SHADOWS) {
        getSoftShadowMaps(function () {
            init();
            animate();
        });
    } else {
        init();
        animate();
    }

    function init() {
        // scene
        scene = new THREE.Scene();
        // scene.fog = new THREE.Fog(0x999999, 5, 100);
        scene.add(new THREE.AmbientLight(0x444444));

        // camera
        camera = perspectivecamera = getCamera();

        // camera
        // camera = orthocamera = getOrthoCamera();

        // light
        // light = new THREE.PointLight(0xfefefe, 2, 100, 2);
        light = new THREE.SpotLight(0xfefefe, 1, 1000, 1, 1, 0.1);
        // light = new THREE.DirectionalLight(0xdfebff, 1.75);
        light.position.set(35, 50, -35);
        light.castShadow = true;
        light.shadow.mapSize.width = SHADOW_SIZE;
        light.shadow.mapSize.height = SHADOW_SIZE;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500;
        // light.shadow.bias = 0.0001;
        light.shadow.radius = 1.0001;
        scene.add(light);

        // group
        group = new THREE.Group();

        // plane
        geometry = new THREE.PlaneGeometry(500, 500, 25, 25);
        material = new THREE.ShadowMaterial({
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        /*
        material = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughtness: 1,
            metalness: 0,
            side: THREE.DoubleSide
        });
        */
        plane = new THREE.Mesh(geometry, material);
        plane.rotation.set(-Math.PI / 2, 0, 0);
        plane.position.set(0, 0, -1);
        plane.receiveShadow = true;
        scene.add(plane);

        // connector
        envMap = new THREE.TextureLoader().load('img/envmap-sm.jpg');
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        envMap.magFilter = THREE.LinearFilter;
        envMap.minFilter = THREE.LinearMipMapLinearFilter;
        // geometry = new THREE.BoxGeometry(10, 10, 10);
        geometry = new THREE.SphereGeometry(1, 64, 64);
        // material = new THREE.MeshNormalMaterial();
        material = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.2,
            metalness: 0.95,
            envMap: envMap,
            envMapIntensity: 1,
        });
        connector = new THREE.Mesh(geometry, material);
        connector.position.set(0, 1, 0);
        connector.receiveShadow = false;
        connector.castShadow = true;
        group.add(connector);
        connectors.push(connector);

        // emitter
        geometry = new THREE.BoxGeometry(3, 3, 3);
        material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.6,
            metalness: 0.1,
            opacity: 1,
            transparent: false,
        });
        /*
        geometry = new THREE.SphereGeometry(2, 64, 64);
        material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.5,
            envMap: envMap,
            envMapIntensity: 1,
        });
        */
        emitter = new THREE.Mesh(geometry, material);
        // emitter.position.set(-35, 1.5, 35);
        emitter.position.set(55, 4, 0);
        emitter.receiveShadow = false;
        emitter.castShadow = true;
        // ring
        if (SHOW_RING) {
            geometry = new THREE.RingGeometry(3, 3.3, 32, 1);
            material = new THREE.MeshStandardMaterial({
                color: 0x3f3b38,
                roughness: 0.9,
                metalness: 0.1,
                opacity: 0.0,
                transparent: true,
            });
            ring = new THREE.Mesh(geometry, material);
            ring.rotation.set(-Math.PI / 2, 0, 0);
            ring.receiveShadow = false;
            ring.castShadow = false;
            emitter.add(ring);
        }
        //
        group.add(emitter);
        hittables.push(emitter);

        // disc
        geometry = new THREE.RingGeometry(12.1, 45, 64, 4);
        // geometry = new THREE.CircleGeometry(45, 128);
        material = new THREE.MeshStandardMaterial({
            color: 0x2f2d2b,
            map: diffuseMap,
            bumpMap: bumpMap,
            bumpScale: 0.02,
            // envMap: envMap,
            // envMapIntensity: 1,
            roughness: 1.0, //0.02,
            roughnessMap: roughnessMap,
            // roughnessMap: metalnessMap,
            metalness: 1.0,
            metalnessMap: metalnessMap,
            // opacity: 1,
            // transparent: false,
            // side: THREE.DoubleSide
        });
        // material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
        disc = new THREE.Mesh(geometry, material);
        disc.position.set(0, 0.1, 0);
        disc.rotation.set(-Math.PI / 2, 0, 0);
        disc.receiveShadow = true;
        disc.castShadow = true;
        diffuseMap = new THREE.TextureLoader().load('img/disc.jpg');
        geometry = new THREE.RingGeometry(1.3, 12, 64, 4);
        // geometry = new THREE.CircleGeometry(12, 128);
        material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: diffuseMap,
            roughness: 0.6,
            metalness: 0.4,
        });
        label = new THREE.Mesh(geometry, material);
        label.position.set(0, 0, 0);
        label.receiveShadow = true;
        label.castShadow = true;
        disc.add(label);
        group.add(disc);

        // cover
        diffuseMap = new THREE.TextureLoader().load('img/cover.jpg');
        geometry = new THREE.PlaneGeometry(90, 90, 32, 32);
        material = new THREE.MeshStandardMaterial({
            color: 0xefebe8,
            map: diffuseMap,
            roughness: 0.6,
            metalness: 0.1,
            opacity: 1,
            transparent: false,
        });
        cover = new THREE.Mesh(geometry, material);
        cover.rotation.set(-Math.PI / 2, 0, 0);
        cover.position.set(-25, 4, 0);
        cover.receiveShadow = true;
        cover.castShadow = true;
        group.add(cover);
        scene.add(group);

        // renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.shadowMap.enabled = true;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        // renderer.shadowMap.type = THREE.BasicShadowMap; // 0
        // renderer.shadowMap.type = THREE.PCFShadowMap; // 1
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 2  

        // controls
        /*
        orbit = new THREE.OrbitControls(camera);
        orbit.update();
        */

        drag = new THREE.DragControls(hittables, camera, renderer.domElement);
        drag.addEventListener('dragstart', function (e) {
            dragging = true;
            if (orbit) {
                orbit.enabled = false;
            }
            song.start();
            song.theremin.start();
        });
        drag.addEventListener('drag', function (e) {
            var a = emitter.position.clone();
            var b = connector.position.clone();
            var d = a.sub(b);
            song.theremin.drag(d);
            if (song.speed === 0) {
                TweenLite.to(song, 0.5, {
                    speed: 1,
                    ease: Power2.easeOut,
                    onUpdate: function () {
                        song.setSpeed(song.speed);
                    },
                });
            }
        });
        drag.addEventListener('dragend', function (e) {
            dragging = false;
            if (orbit) {
                orbit.enabled = true;
            }
            if (song.speed !== 0) {
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

                TweenLite.to(emitter.rotation, 1, {
                    y: Math.round(emitter.rotation.y / Math.PI * 2) * Math.PI / 2,
                    ease: Power2.easeOut,
                });

                TweenLite.to(emitter.position, 1, {
                    x: 55,
                    z: 0,
                    ease: Elastic.easeOut,
                });

                TweenLite.to(light.position, 1, {
                    x: 35,
                    z: -35,
                    ease: Elastic.easeOut,
                });
            }
        });

        setTimeout(function () {
            container.appendChild(renderer.domElement);
            resize();
        }, 100);
    }

    function animate(time) {
        stats.begin();
        var fps = getFps() || 60;
        var speed33 = 0.0575959 * 60 / fps;
        if (ring) {
            var s = Math.abs(Math.sin(time * 0.001)) * (1 - song.speed);
            ring.material.opacity = s;
            ring.scale.set(1 + s * 0.5, 1 + s * 0.5, 1 + s * 0.5);
        }
        connector.rotation.y += speed33 * song.speed;
        disc.rotation.z += speed33 * song.speed;
        emitter.rotation.y += speed33 * song.speed;
        cover.position.x = -25 - 90 * song.speed;
        if (dragging) {
            light.position.x += (emitter.position.x * -1 - light.position.x) / 20;
            light.position.z += (emitter.position.z * -1 - light.position.z) / 20;
        }
        // collisions();
        renderer.render(scene, camera);
        stats.end();
        requestAnimationFrame(animate);
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
                if (synth) {
                    synth.triggerAttack('C4');
                }
            } else {
                if (synth) {
                    synth.triggerRelease();
                }
            }
        });
    }

    function resize() {
        camera.resize();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.clearDepth();
    }

    function getDiscTextures(type, size) {
        size = size || 2048;
        var w = size,
            h = size;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        var x = w / 2;
        var y = h / 2;
        var from = size / 2 * 0.3,
            to = size / 2 * 0.98,
            i;

        function circle(radius, fill, stroke, lineWidth) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            if (fill) {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            if (stroke) {
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = stroke;
                ctx.stroke();
            }
            ctx.closePath();
        }
        if (type === textureTypes.DIFFUSE) {
            ctx.fillStyle = '#2f2d2b';
            ctx.rect(0, 0, w, h);
            ctx.fill();
            circle(from, '#332d2a');
        }
        if (type === textureTypes.LIGHT) {
            ctx.fillStyle = '#000000';
            ctx.rect(0, 0, w, h);
            ctx.fill();
            for (i = from; i < to; i += 10 + Math.random() * 30) {
                var r = i + Math.random() * 0.2;
                var t = (20 + Math.random() * 30) / 2;
                t = Math.min(t, to - r - 1) * 2;
                circle(r, null, 'rgba(255, 255, 255, ' + Math.random() * 0.5 + ')', t);
            }
        }
        if (type === textureTypes.BUMP) {
            ctx.fillStyle = '#000000';
            ctx.rect(0, 0, w, h);
            ctx.fill();
            for (i = from; i < to; i += 2) {
                circle(i + Math.random() * 0.2, null, 'rgba(255, 255, 255, ' + Math.random() * 0.5 + ')', 0.6);
            }
        }
        // THREE.ClampToEdgeWrapping - THREE.RepeatWrapping
        var texture = new THREE.CanvasTexture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter, THREE.RGBFormat, THREE.UnsignedByteType, 2);
        if (DEBUG) {
            canvas.setAttribute('style', 'top:' + (256 * T) + 'px;');
            document.body.appendChild(canvas);
        }
        T++;
        return texture;
    }

    function getCamera() {
        var camera = new THREE.PerspectiveCamera(20, container.offsetWidth / container.offsetHeight, 0.01, 1000);
        camera.position.set(0, 300, 0);
        camera.lookAt(0, 0, 0);
        camera.resize = function () {
            camera.aspect = container.offsetWidth / container.offsetHeight;
            camera.updateProjectionMatrix();
            camera.fit(group, 1.2);
        };
        camera.fit = function (object, offset, up) {
            offset = offset || 1.2;
            up = up || new THREE.Vector3(0, 0, -1);
            var box = new THREE.Box3();
            var boxSize = new THREE.Vector3();
            var center = new THREE.Vector3();
            box.setFromObject(object);
            box.getCenter(center);
            box.applyMatrix4(camera.matrixWorldInverse);
            box.getSize(boxSize);
            var aspect = boxSize.x / boxSize.y;
            var size = (camera.aspect > aspect) ? boxSize.y : boxSize.x;
            if (camera.aspect < aspect) {
                size /= camera.aspect;
            }
            size *= offset;
            var z = size / 2 / Math.sin(camera.fov / 2 * RAD);
            camera.position.normalize().multiplyScalar(z);
            camera.up = up;
            var distance = camera.position.distanceTo(center);
            // console.log(camera.position, disc.position);
            if (orbit) {
                orbit.target = center;
                orbit.maxDistance = distance + size;
                orbit.update();
            } else {
                // camera.lookAt(center.x, center.y, center.z);
                camera.far = distance + size;
            }
            camera.updateProjectionMatrix();
        };
        window.camera = camera;
        scene.add(camera);
        return camera;
    }

    function getOrthoCamera() {
        var size = 80,
            aspect = container.offsetWidth / container.offsetHeight,
            w = size * aspect,
            h = size;
        var camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, -1000, 1000);
        camera.position.set(0, 30, 0);
        camera.lookAt(0, 0, 0);
        camera.resize = function () {
            aspect = container.offsetWidth / container.offsetHeight;
            w = size * aspect;
            h = size;
            camera.left = w / -2;
            camera.right = w / 2;
            camera.top = h / 2;
            camera.bottom = h / -2;
            camera.updateProjectionMatrix();
        };
        window.camera = camera;
        scene.add(camera);
        return camera;
    }

    function getSoftShadowMaps(callback) {
        http({
            url: 'glsl/pcss.glsl',
            onload: function (data) {
                var shader = THREE.ShaderChunk.shadowmap_pars_fragment;
                shader = shader.replace(
                    '#ifdef USE_SHADOWMAP',
                    '#ifdef USE_SHADOWMAP' + data
                );
                shader = shader.replace(
                    '#if defined( SHADOWMAP_TYPE_PCF )',
                    '\nreturn PCSS(shadowMap, shadowCoord);\n' + '#if defined( SHADOWMAP_TYPE_PCF )'
                );
                THREE.ShaderChunk.shadowmap_pars_fragment = shader;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
    }

    function getFps() {
        var now = performance.now();
        while (ticks.length > 0 && ticks[0] <= now - 1000) {
            ticks.shift();
        }
        ticks.push(now);
        fps = ticks.length;
        return fps;
    }

    function http(options) {
        var o = {
            method: 'GET',
            responseType: 'text',
        };
        if (!options || !options.url || !options.onload) {
            return;
        }
        for (var p in options) {
            o[p] = options[p];
        }
        var req = new XMLHttpRequest();
        req.open(o.method, o.url, true);
        req.responseType = o.responseType; // 'blob';
        req.onload = function () {
            if (this.status === 200) {
                // var blob = this.response;
                // var image = URL.createObjectURL(blob); // IE10+
                o.onload(this.response);
            }
        };
        if (o.onerror) {
            req.onerror = o.onerror;
        }
        if (o.onprogress) {
            req.onerror = o.onprogress;
        }
        req.send();
    }

    /*
    function onWheel(e) {
        var direction = e.deltaY / Math.abs(e.deltaY);
        camera.position.z = camera.position.z + direction;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        console.log('onWheel', direction);
    }
    window.addEventListener('wheel', onWheel);
    */

    window.addEventListener('resize', resize, false);

}());