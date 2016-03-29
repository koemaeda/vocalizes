"use strict";

function Vocalize(bpm, lowestNote, highestNote) {
  var self = this;

  // Implementation specific data
  this.notes;
  this.chord;
  this.timeSignature;

  // Runtime/configuration data
  this.lowestKey;
  this.highestKey;
  this.bpm;

  // Play queue (for async loop)
  this.midiTime = 0;
  this.playing = false;
  this.eventQueue = [];

  // Event handlers
  this.onStart = function() { console.debug("onStart") };
  this.onStop = function() { console.debug("onStop") };
  this.onChangedKey = function(key) { console.debug("onChangedKey", key) };

  /**
   * Determines the lowest key to be played according to the lowest possible note
   */
  this.setLowestKey = function(lowestNote)
  {
    var key = MIDI.keyToNote[lowestNote];

    // Get the lowest note in the melody
    var lowestMelodyNote = this.getMIDINote(key, this.notes[0].note);
    for (var i=0; i<this.notes.length; i++) {
      var note = this.getMIDINote(key, this.notes[i].note);
      if (note < lowestMelodyNote)
        lowestMelodyNote = note;
    }
    this.lowestKey = key + (key - lowestMelodyNote);
  };

  /**
   * Determines the highest key to be played according to the highest possible note
   */
  this.setHighestKey = function(highestNote)
  {
    var key = MIDI.keyToNote[highestNote];

    // Get the highest note in the melody
    var highestMelodyNote = this.getMIDINote(key, this.notes[0].note);
    for (var i=0; i<this.notes.length; i++) {
      var note = this.getMIDINote(key, this.notes[i].note);
      if (note > highestMelodyNote)
        highestMelodyNote = note;
    }
    this.highestKey = key + (key - highestMelodyNote);
  };

  /**
   * Play the vocalize for all the keys.
   * Fills the schedule array with all the notes and rests to be played and starts the async loop.
   */
  this.play = function()
  {
    this.playing = true;
    this.onStart();

    // Go up
    for (var key=this.lowestKey; key<this.highestKey; key++)
      this.playKey(key);
    // Go down
    for (var key=this.highestKey; key>=this.lowestKey; key--)
      this.playKey(key);

    this.onMIDITime(function() { self.stop(); });
  }

  /**
   * Stops playing the vocalize
   */
  this.stop = function()
  {
    while (this.eventQueue.length) {
      var source = this.eventQueue.pop();
      if (! source) continue;
      if (typeof(source) === "number")
        clearTimeout(source);
      else
        source.stop();
    }
    this.playing = false;
    this.onStop();
  }

  /**
   * Enqueue the vocalize notes for a key.
   */
  this.playKey = function(key)
  {
    this.onMIDITime(function() { self.onChangedKey(key); });

    // Play the chord
    this.playNotes(key, this.chord, 1);
    this.playNotes(key, ["rest"], (this.timeSignature - 1));

    // Play the melody
    for (var i=0; i<this.notes.length; i++)
      this.playNotes(key, [this.notes[i].note], this.notes[i].duration);
    this.playNotes(key, "rest", 1);

    // Play the chord again
    this.playNotes(key, this.chord, 1);
  }

  /**
   * Enqueue notes
   */
  this.playNotes = function(key, notes, duration)
  {
    var time = this.durationToMIDITime(duration);
    for (var i=0; i<notes.length; i++) {
      var note = this.getMIDINote(key, notes[i]);
      this.eventQueue.push(MIDI.noteOn(0, note, 255, this.midiTime));
      this.eventQueue.push(MIDI.noteOff(0, note, this.midiTime + time));
    }
    this.midiTime += time;
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
    return (100 / this.timeSignature / this.bpm) * duration;
  };

  /**
   * Gets the MIDI note name for a note name, relative to the base note.
   * Ex (on 48 base note): T => 48, 2 => 50, 6b => 56
   */
  this.getMIDINote = function(key, note)
  {
    var matches = note.match(/(T|\d+)([b#-+]?)/);
    if (! matches)
      return null;
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
    that.setLowestKey(lowestNote);
    that.setHighestKey(highestNote);
    console.log("Vocalize", "Initialized", lowestNote, highestNote);
  })(this);
}