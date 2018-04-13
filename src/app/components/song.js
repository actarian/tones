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