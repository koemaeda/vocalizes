"use strict";

function VocalizePlayer(bpm, lowestNote, highestNote) {
  var self = this;

  // Runtime/configuration data
  this.vocalize;
  this.lowestKey;
  this.highestKey;
  this.keys = [];
  this.currentKey;
  this.goingDown = false;
  this.playing = false;

  // Event handlers
  this.onStart = function() { };
  this.onStop = function() { };
  this.onChangeKey = function(key) { };
  this.onFinish = function() { };
  this.onNoteOn = function(note) { };
  this.onNoteOff = function(note) { };

  /**
   * Determines the lowest key to be played according to the lowest possible note
   */
  this.setLowestKey = function(lowestNote)
  {
    var key = MIDI.keyToNote[lowestNote];
    this.lowestKey = key + (key - this.vocalize.getLowestNote(key));
  };

  /**
   * Determines the highest key to be played according to the highest possible note
   */
  this.setHighestKey = function(highestNote)
  {
    var key = MIDI.keyToNote[highestNote];
    this.highestKey = key + (key - this.vocalize.getHighestNote(key));
  };

  /**
   * Builds the key sequence to be played
   */
  this.buildKeys = function()
  {
    for (var key=this.lowestKey; key<this.highestKey; key++)
      this.keys.push(key);
    console.debug("VocalizePlayer", "buildKeys", this.keys);
  }

  /**
   * Play a Vocalize (for all the keys).
   */
  this.play = function(vocalizeName)
  {
    console.debug("VocalizePlayer.play", vocalizeName);

    // Initialize the Vocalize
    var vocalizeClass = window[vocalizeName];
    this.vocalize = new vocalizeClass(bpm);
    this.setLowestKey(lowestNote);
    this.setHighestKey(highestNote);
    this.buildKeys();
    this.vocalize.onNoteOn = function(note) { self.onNoteOn(note); };
    this.vocalize.onNoteOff = function(note) { self.onNoteOff(note); };

    // Start by going up
    this.goingDown = false;
    this.currentKey = -1;
    this.playing = true;
    this.onStart();

    this.vocalize.onFinish = function() {
      self.playNextKey();
    }
    this.playNextKey();
  }

  /**
   * Stops playing the vocalize
   */
  this.stop = function()
  {
    console.debug("VocalizePlayer.stop");
    this.vocalize.onStop = function() {
      this.onStop();
    }
    this.vocalize.stop();
    this.playing = false;
  }

  /**
   * Start playing the vocalize for the next key
   */
  this.playNextKey = function()
  {
    if (! this.playing)
      return;
    console.debug("VocalizePlayer.playNextKey");

    // Move on to the next or change direction
    if (this.goingDown)
      this.currentKey--;
    else {
      this.currentKey++;
      if (this.currentKey >= this.keys.length) {
        // Start going down now
        this.goingDown = true;
        this.currentKey = this.keys.length - 2;
      }
    }

    // Check if we're finished
    if (this.currentKey < 0) {
      this.stop();
      this.onFinish();
      return;
    }

    // Play the current key
    var key = this.keys[this.currentKey];
    this.onChangeKey(key);
    this.vocalize.play(key);
  }

  /**
   * Constructor
   */
  var __construct = (function(that) {
    console.log("VocalizePlayer", "Initialized", lowestNote, highestNote);
  })(this);
}