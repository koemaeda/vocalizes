"use strict";

function VocalizeApp()
{
  var self = this;

  this.bpm = 60;
  this.lowestNote;
  this.highestNote;
  this.player;

  // Event handlers
  this.onReady = function() {};
  this.onNoteOn = function(note) {};
  this.onNoteOff = function(note) {};

  this.playVocalize = function(name)
  {
    this.player.play(name);
  };

  /**
   * Initializes the MIDI library
   */
  this.initializeMIDI = function()
  {
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instrument: "acoustic_grand_piano",
      onprogress: function(state, progress) {
        console.log(state, progress);
      },
      onsuccess: function() {
        MIDI.setVolume(0, 255);
        console.debug("VocalizeApp", "MIDI initialized");
        self.onReady();
      }
    });
  }

  /**
   * Initializes the Vocalize Player
   */
  this.initializePlayer = function()
  {
    this.player = new VocalizePlayer(this.bpm, this.lowestNote, this.highestNote);
    this.player.onNoteOn = function(note) { self.onNoteOn(note); };
    this.player.onNoteOff = function(note) { self.onNoteOff(note); };
  }

  /**
   * Constructor - Initializes the MIDI and Player
   */
  var __construct = (function(that) {
    // Load configuration
    that.highestNote = "C5";
    that.lowestNote = "C3";

    // Initialize MIDI
    that.initializeMIDI();

    // Initialize the player
    that.initializePlayer();
  })(this);
}