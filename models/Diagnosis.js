const mongoose = require("mongoose");
const Hospital = require("./Hospital");

const diagnosisSchema = mongoose.Schema({
  HospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hospital",
  },
  Diagnosis: String,
});

module.exports = mongoose.model("diagnosis", diagnosisSchema);
