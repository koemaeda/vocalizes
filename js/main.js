"use strict";

$(document).ready(function () {
  var app = new VocalizeApp;
  app.onReady = function() {
    app.playVocalize("MajorTriadVocalize");
  };

  app.onNoteOn = function(note) {
    var noteDiv = $("#"+note);
    noteDiv.addClass("on");
  }
  app.onNoteOff = function(note) {
    var noteDiv = $("#"+note);
    noteDiv.removeClass("on");
  }
});