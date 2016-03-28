"use strict";

$(document).ready(function () {
  var app = new VocalizeApp;
  app.onReady = function() {
    app.playVocalize("MajorTriad");
  };
});