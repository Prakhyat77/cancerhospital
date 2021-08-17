const mongoose = require("mongoose");
const Patient = require("./Patient");

const prescriptionSchema = mongoose.Schema({
  PrescriptionDate: Date,
  Diagnosis: String,
  Case: String,
  Chemotherapy: String,
  ChemoCase:String,
  RemarkMedicine: [
    {
      type: String,
    },
  ],
  OPD: Number,
  IPD: Number,
  ReferralCase: String,
  Palliative: String,
  PalliativeCase:String,
  Dr_Name: String,
  Patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "patient",
  },
});

module.exports = mongoose.model("prescription", prescriptionSchema);
