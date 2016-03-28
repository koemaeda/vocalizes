"use strict";

function VocalizeApp()
{
  this.bpm = 60;
  this.lowestNote;
  this.highestNote;

  // Event handlers
  this.onReady = function() {};

  this.playVocalize = function(name)
  {
    var vocalize = new MajorTriadVocalize(this.bpm, this.lowestNote, this.highestNote);
    vocalize.play();
  };

  /**
   * Constructor - Initializes the MIDI
   */
  var __construct = (function(that) {
    // Load configuration
    that.lowestNote = "C3";
    that.highestNote = "D4";

    // Initialize MIDI
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instrument: "acoustic_grand_piano",
      onprogress: function(state, progress) {
        console.log(state, progress);
      },
      onsuccess: function() {
        MIDI.setVolume(0, 255);
        console.debug("VocalizeApp", "MIDI initialized");
        that.onReady();
      }
    });
  })(this);
}