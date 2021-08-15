const mongoose = require("mongoose");
const Hospital = require("./Hospital");

const medicineSchema = mongoose.Schema({
  HospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hospital",
  },
  Medicine: String,
  MedicineType: String,
  Quantity: Number,
});

module.exports = mongoose.model("medicine", medicineSchema);
