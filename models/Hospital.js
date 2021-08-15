const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const Patient = require("./Patient");

const hospitalSchema = mongoose.Schema({
  HospitalName: String,
  username: String,
  NumberPatient: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
    },
  ],
  password: String,
});

hospitalSchema.plugin(plm);

module.exports = mongoose.model("hospital", hospitalSchema);
