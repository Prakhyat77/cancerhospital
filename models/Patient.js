const mongoose = require("mongoose");
const Hospital = require("./Hospital");
const Prescription = require("./Prescription");

const patientSchema = mongoose.Schema({
  Name: String,
  Relationship: String,
  Relative: String,
  Address: String,
  Village: String,
  Tehsil: String,
  District: String,
  Age: Number,
  Gender: String,
  Mobile: Number,
  Aadhaar: Number,
  Prescription: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "prescription",
    },
  ],
  HospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hospital",
  },
});

module.exports = mongoose.model("patient", patientSchema);
