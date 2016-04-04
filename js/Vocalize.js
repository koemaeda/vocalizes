"use strict";

function Vocalize(bpm) {
  var self = this;

  // Implementation specific data
  this.notes;
  this.chord;
  this.timeSignature;

  // Runtime/configuration data
  this.bpm;

  // Play queue (for async loop)
  this.midiTime = 0;
  this.realTime = 0;
  this.playing = false;
  this.eventQueue = [];

  // Event handlers
  this.onStart = function(key) { };
  this.onStop = function() { };
  this.onFinish = function() { };
  this.onNoteOn = function(note) { };
  this.onNoteOff = function(note) { };

  /**
   * Play the vocalize for a key.
   */
  this.play = function(key)
  {
    this.playing = true;
    this.midiTime = 0;
    this.realTime = 0;
    this.onStart(key);

    console.debug("Vocalize.play", key, this);

    // Play the chord
    this.playNotes(key, this.chord, 2);
    this.playNotes(key, ["rest"], 2);

    // Play the melody
    for (var i=0; i<this.notes.length; i++)
      this.playNotes(key, [this.notes[i].note], this.notes[i].duration);
    this.playNotes(key, "rest", 2);

    // Play the chord again
    this.playNotes(key, this.chord, 2);

    console.debug(this.midiTime, this.realTime);
    this.onMIDITime(function() {
      self.stop();
      self.onFinish();
    });
  }

  /**
   * Stops playing the vocalize
   */
  this.stop = function()
  {
    if (! this.playing)
      return;
    console.debug("Vocalize.stop");

    while (this.eventQueue.length) {
      var eventItem = this.eventQueue.pop();
      if (! eventItem.source) continue;
      if (typeof(eventItem.source) === "number")
        clearTimeout(eventItem.source);
      else
        eventItem.source.stop();
      clearTimeout(eventItem.timeout);
    }
    this.playing = false;
    this.onStop();
  }

  /**
   * Enqueue notes
   */
  this.playNotes = function(key, notes, duration)
  {
    var time = this.durationToMIDITime(duration);
    for (var i=0; i<notes.length; i++) {
      var note = this.getMIDINote(key, notes[i]);
      this.eventQueue.push({
        source: MIDI.noteOn(0, note, 255, this.midiTime),
        timeout: this.noteCallback(this.onNoteOn, note, this.realTime)
      });
      this.eventQueue.push({
        source: MIDI.noteOff(0, note, this.midiTime + time),
        timeout: this.noteCallback(this.onNoteOff, note, this.realTime + (time * 1000))
      });
    }
    this.midiTime += time;
    this.realTime += (time * 1000);
  }
  this.noteCallback = function(callback, note, timeout) {
    return setTimeout(function() {
      callback(note);
    }, timeout);
  }

  /**
   * Sets a timer to run a callback when the current MIDI time is reached
   */
  this.onMIDITime = function(callback) {
    this.eventQueue.push(setTimeout(callback, this.midiTime * 1000));
  };

  /**
   * Calculates the duration time (in MIDI time) for a note/rest
   */
  this.durationToMIDITime = function(duration)
  {
    return ((60 / this.bpm) * duration) / this.timeSignature;
  };

  /**
   * Gets the MIDI note name for a note name, relative to the base note.
   * Ex (on 48 base note): T => 48, 2 => 50, 6b => 56
   */
  this.getMIDINote = function(key, note)
  {
    var matches = note.match(/(T|\d+)([b#-+]?)/);
    if (! matches)
      return 0;
    var noteIndex = parseInt(matches[1]) || 1;
    var octaveOffset = Math.floor(noteIndex / 8) * 12;
    noteIndex %= 8;
    if (octaveOffset > 0) noteIndex++;
    var noteOffset = 0;
    for (var i=1; i<noteIndex; i++)
      noteOffset += (i == 3) ? 1 : 2; // tone or semitone
    if (matches[2] == 'b' || matches[2] == '-') noteOffset--;
    if (matches[2] == '#' || matches[2] == '+') noteOffset++;
    return key + octaveOffset + noteOffset;
  }

  /**
   * Gets the lowest note for a key (in the melody)
   */
  this.getLowestNote = function(key)
  {
    // Get the lowest note in the melody
    var lowestMelodyNote = this.getMIDINote(key, this.notes[0].note);
    for (var i=0; i<this.notes.length; i++) {
      var note = this.getMIDINote(key, this.notes[i].note);
      if (note < lowestMelodyNote)
        lowestMelodyNote = note;
    }
    return lowestMelodyNote;
  }

  /**
   * Gets the highest note for a key (in the melody)
   */
  this.getHighestNote = function(key)
  {
    // Get the highest note in the melody
    var highestMelodyNote = this.getMIDINote(key, this.notes[0].note);
    for (var i=0; i<this.notes.length; i++) {
      var note = this.getMIDINote(key, this.notes[i].note);
      if (note > highestMelodyNote)
        highestMelodyNote = note;
    }
    return highestMelodyNote;
  }

  /**
   * Return the current time (for scheduling)
   */
  var getNow = function() {
    if (window.performance && window.performance.now)
      return window.performance.now();
    else
      return Date.now();
	};

  /**
   * Constructor - Initializes the vocalize with a sequence of intervals/text
   */
  var __construct = (function(that) {
    that.bpm = bpm;
    console.log("Vocalize", "Initialized", bpm);
  })(this);
}