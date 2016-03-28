"use strict";

var MajorTriadVocalize = Vocalize;
MajorTriadVocalize.prototype = {
  chord: ["T", "3", "5", "8"],
  timeSignature: 4,
  notes: [
    {note: "T", duration: 1, text: ""},
    {note: "3", duration: 1, text: ""},
    {note: "5", duration: 1, text: ""},
    {note: "8", duration: 1, text: ""},
    {note: "8", duration: 1, text: ""},
    {note: "8", duration: 1, text: ""},
    {note: "8", duration: 1, text: ""},
    {note: "5", duration: 1, text: ""},
    {note: "3", duration: 1, text: ""},
    {note: "T", duration: 2, text: ""},
  ]
};
