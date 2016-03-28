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
  this.playing = false;
  this.queue = [];
  this.queuePosition = 0;

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
    // Go up
    for (var key=this.lowestKey; key<this.highestKey; key++)
      this.enqueueKey(key);
    // Go down
    for (var key=this.highestKey; key>=this.lowestKey; key--)
      this.enqueueKey(key);

    this.playing = true;
    this.onStart();
    this.processQueue();
  }

  /**
   * Stops playing the vocalize
   */
  this.stop = function()
  {
    this.playing = false;
    this.queue = [];
    this.queuePosition = 0;
    this.onStop();
  }

  /**
   * Enqueue the vocalize notes for a key.
   */
  this.enqueueKey = function(key)
  {
    this.enqueueEvent("changedKey", MIDI.noteToKey[key]);

    // Play the chord
    this.enqueueNotes(key, this.chord, 1);
    this.enqueueNotes(key, ["rest"], (this.timeSignature - 1));

    // Play the melody
    for (var i=0; i<this.notes.length; i++)
      this.enqueueNotes(key, [this.notes[i].note], this.notes[i].duration);
    this.enqueueNotes(key, "rest", 1);
  }

  /**
   * Asynchronous loop for processing the queue
   */
  this.processQueue = function()
  {
    var queueItem = this.queue[this.queuePosition++];
    switch (queueItem.event) {
      case "notes":
        for (var i=0; i<queueItem.notes.length; i++)
          var nextTime = this.playNote(queueItem.notes[i], queueItem.duration);
        if (this.queuePosition == this.queue.length)
          return this.stop();
        setTimeout(function() {self.processQueue();}, nextTime);
        break;
      case "changedKey":
        this.onChangedKey(queueItem.data);
        setTimeout(function() {self.processQueue();}, 0);
        break;
    }
  }

  /**
   * Adds an event to the queue
   */
  this.enqueueEvent = function(event, data)
  {
    this.queue[this.queue.length] = {
      event: event,
      data: data
    };
  }
  
  /**
   * Adds a notes to the queue
   */
  this.enqueueNotes = function(key, notes, duration)
  {
    var queueItem = {
      event: "notes",
      notes: [],
      duration: duration
    };
    for (var i=0; i<notes.length; i++)
      queueItem.notes[i] = this.getMIDINote(key, notes[i]);
    this.queue[this.queue.length] = queueItem;
  }

  /**
   * Plays a MIDI note
   */
  this.playNote = function(note, duration)
  {
    if (! this.playing) return false;
    //console.debug("VocalizePlayer", "playing note", note, duration);
    var time = this.durationToTime(duration);

    MIDI.noteOn(0, note, 255, 0);
    setTimeout(function() {
      MIDI.noteOff(0, note, 0);
    }, time);
    return time;
  };

  /**
   * Calculates the duration time (in milliseconds) for a note/rest
   */
  this.durationToTime = function(duration)
  {
    return (60000 / this.timeSignature / this.bpm) * duration;
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