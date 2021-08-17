const express = require("express");
const router = express.Router();
const passport = require("passport");
const localStrategy = require("passport-local");

//Import models
const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Diagnosis = require("../models/Diagnosis");
const Medicine = require("../models/Medicine");

passport.use(new localStrategy(Hospital.authenticate()));

//Get Hospital Login
router.get("/", function (req, res, next) {
  res.render("hospitalLogin");
});

// //Post Hospital Register
// router.post("/register", (req, res) => {
//   let newHospital = {
//     HospitalName: req.body.hname,
//     username: req.body.hcode,
//   };
//   Hospital.register(newHospital, req.body.password)
//     .then((hospital) => {
//       res.redirect("/");
//     })
//     .catch((err) => {
//       res.send(err);
//     });
// });
//Post Hospital Login
router.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/patientRegister",
    failureRedirect: "/",
  }),
  (req, res) => {},
);

//Get Patient Register
router.get("/patientRegister", isLoggedIn, (req, res) => {
  res.render("patientRegister", { pro: 0 });
});

//Post Patient Register
router.post("/patientRegister", isLoggedIn, async (req, res) => {
  try {
    const mobile = await Patient.findOne({ Mobile: req.body.mobile });
    if (mobile === null) {
      Hospital.findOne({ username: req.session.passport.user })
        .then((hospitalDetails) => {
          const age = req.body.age;
          const dobYear = Date().slice(11, 15) - age;
          const patient = new Patient({
            Name: req.body.name,
            Relationship: req.body.relationship,
            Relative: req.body.relative,
            Address: req.body.address,
            Village: req.body.village,
            Tehsil: req.body.tehsil,
            District: req.body.district,
            Age: dobYear,
            Gender: req.body.gender,
            Mobile: req.body.mobile,
            Aadhaar: req.body.aadhaar,
            HospitalId: hospitalDetails._id,
          });
          patient
            .save()
            .then((patientDetails) => {
              hospitalDetails.NumberPatient.push(patientDetails._id);
              hospitalDetails
                .save()
                .then(() => {
                  res.redirect("/patientLogin");
                })
                .catch((err) => {
                  res.send(err);
                });
            })
            .catch((err) => {
              res.send(err);
            });
        })
        .catch((err) => {
          res.send(err);
        });
    } else {
      res.render("patientRegister", { pro: 1 });
    }
  } catch (err) {
    res.send(err);
  }
});

//Get Edit Patient
router.get("/editPatient/:patientId", isLoggedIn, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    res.render("patientEdit", { pro: 0, patient: patient });
  } catch (err) {
    res.send(err);
  }
});

//Post Edit Patient
router.post("/editPatient/:patientId", isLoggedIn, async (req, res) => {
  const age = req.body.age;
  const dobYear = Date().slice(11, 15) - age;
  Patient.updateOne(
    { _id: req.params.patientId },
    {
      $set: {
        Name: req.body.name,
        Relationship: req.body.relationship,
        Relative: req.body.relative,
        Address: req.body.address,
        Village: req.body.village,
        Tehsil: req.body.tehsil,
        District: req.body.district,
        Age: dobYear,
        Gender: req.body.gender,
        Aadhaar: req.body.aadhaar,
      },
    },
  )
    .then(() => {
      res.redirect("/patientReport");
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Patient Report
router.get("/patientReport", isLoggedIn, (req, res) => {
  Patient.find()
    .sort({ _id: -1 })
    .then((patientDetails) => {
      res.render("patientReport", {
        patientDetails: patientDetails,
        message: req.flash("message"),
      });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Patient Report
router.post("/searchpatientReport", isLoggedIn, (req, res) => {
  const name = req.body.name;
  const age = req.body.age;
  const mobile = req.body.mobile;
  const dobYear = Date().slice(11, 15) - age;
  if (name != "" && age != "" && mobile != "") {
    var filterparameter = {
      $and: [
        {
          Name: name,
        },
        { $and: [{ Age: dobYear }, { Mobile: mobile }] },
      ],
    };
  } else if (name != "" && age != "" && mobile == "") {
    var filterparameter = {
      $and: [{ Name: name }, { Age: dobYear }],
    };
  } else if (name != "" && age == "" && mobile != "") {
    var filterparameter = {
      $and: [{ Name: name }, { Mobile: mobile }],
    };
  } else if (name != "" && age == "" && mobile == "") {
    var filterparameter = {
      Name: name,
    };
  } else if (name == "" && age == "" && mobile != "") {
    var filterparameter = {
      Mobile: mobile,
    };
  } else if (name == "" && age != "" && mobile == "") {
    var filterparameter = {
      Age: dobYear,
    };
  } else if (name == "" && age != "" && mobile != "") {
    var filterparameter = { $and: [{ Age: dobYear }, { Mobile: mobile }] };
  } else {
    var filterparameter = {};
  }
  Patient.find(filterparameter)
    .then((patientDetails) => {
      res.render("patientReport", {
        patientDetails: patientDetails,
        message: req.flash("message"),
      });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Delete Patient
router.get("/deletePatient/:patientId", isLoggedIn, (req, res) => {
  Patient.findOne({
    _id: req.params.patientId,
  })
    .then((singlepatientDetails) => {
      if (singlepatientDetails.Prescription.length > 0) {
        req.flash(
          "message",
          "First Delete Patient (" +
            singlepatientDetails.Name +
            ") Prescription of " +
            singlepatientDetails.Mobile,
        );
        res.redirect("/patientReport");
      } else {
        Hospital.findOne({ username: req.session.passport.user })
          .then((hospitalDetails) => {
            Patient.findByIdAndDelete(req.params.patientId)
              .then((patientDetails) => {
                const patientIndex = hospitalDetails.NumberPatient.indexOf(
                  patientDetails._id,
                );
                hospitalDetails.NumberPatient.splice(patientIndex, 1);
                hospitalDetails
                  .save()
                  .then(() => {
                    res.redirect("/patientReport");
                  })
                  .catch((err) => {
                    res.send(err);
                  });
              })
              .catch((err) => {
                res.send(err);
              });
          })
          .catch((err) => {
            res.send(err);
          });
      }
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Patient Login
router.get("/patientLogin", isLoggedIn, (req, res) => {
  res.render("patientLogin");
});

//Post Patient Login
router.post("/patientLogin", isLoggedIn, (req, res) => {
  Patient.findOne({ Mobile: req.body.mobile })
    .then((patientDetails) => {
      if (patientDetails == null) {
        res.redirect("/patientLogin");
      }
      const patientId = patientDetails._id;
      res.redirect("/prescription/" + patientId);
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Diagnosis
router.get("/diagnosis", isLoggedIn, (req, res) => {
  Diagnosis.find()
    .sort({ _id: -1 })
    .then((diagnosisDetails) => {
      res.render("diagnosis", { diagnosisDetails: diagnosisDetails });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Diagnosis
router.post("/diagnosis", isLoggedIn, (req, res) => {
  Hospital.findOne({ username: req.session.passport.user })
    .then((hospitalDetails) => {
      const diagnosis = new Diagnosis({
        Diagnosis: req.body.diagnosis,
        HospitalId: hospitalDetails._id,
      });
      diagnosis
        .save()
        .then(() => {
          res.redirect("/diagnosis");
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Edit Diagnosis
router.get("/editDiagnosis/:diagnosisId", isLoggedIn, (req, res) => {
  Diagnosis.find()
    .sort({ _id: -1 })
    .then((diagnosisDetails) => {
      Diagnosis.findOne({ _id: req.params.diagnosisId })
        .then((diagnosisData) => {
          res.render("diagnosisEdit", {
            diagnosisDetails: diagnosisDetails,
            diagnosisData: diagnosisData,
          });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Edit Diagnosis
router.post("/editDiagnosis/:diagnosisId", isLoggedIn, (req, res) => {
  Diagnosis.updateOne(
    { _id: req.params.diagnosisId },
    { $set: { Diagnosis: req.body.diagnosis } },
  )
    .then(() => {
      res.redirect("/diagnosis");
    })
    .catch((err) => {
      res.send(err);
    });
});

//Delete Diagnosis
router.get("/deleteDiagnosis/:diagnosisId", isLoggedIn, (req, res) => {
  Diagnosis.findOneAndDelete({ _id: req.params.diagnosisId })
    .then(() => {
      res.redirect("/diagnosis");
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Remarks
router.get("/remarks", isLoggedIn, (req, res) => {
  Medicine.find()
    .sort({ _id: -1 })
    .then((remarksDetails) => {
      res.render("remarks", { remarksDetails: remarksDetails });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Remarks
router.post("/remarks", isLoggedIn, (req, res) => {
  Hospital.findOne({ username: req.session.passport.user })
    .then((hospitalDetails) => {
      const medicine = new Medicine({
        Medicine: req.body.remarks,
        MedicineType: req.body.medtype,
        Quantity: req.body.quantity,
        HospitalId: hospitalDetails._id,
      });
      medicine
        .save()
        .then(() => {
          res.redirect("/remarks");
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Get Edit Remarks
router.get("/editRemarks/:remarkId", isLoggedIn, (req, res) => {
  Medicine.find()
    .sort({ _id: -1 })
    .then((remarksDetails) => {
      Medicine.findOne({ _id: req.params.remarkId })
        .then((remarkData) => {
          res.render("remarkEdit", {
            remarksDetails: remarksDetails,
            remarkData: remarkData,
          });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Edit Remarks
router.post("/editRemarks/:remarkId", isLoggedIn, (req, res) => {
  Medicine.updateOne(
    { _id: req.params.remarkId },
    {
      $set: {
        Medicine: req.body.remarks,
        MedicineType: req.body.medtype,
        Quantity: req.body.quantity,
      },
    },
  )
    .then(() => {
      res.redirect("/remarks");
    })
    .catch((err) => {
      res.send(err);
    });
});

//Delete Remarks
router.get("/deleteRemarks/:remarkId", isLoggedIn, (req, res) => {
  Medicine.deleteOne({ _id: req.params.remarkId })
    .then(() => {
      res.redirect("/remarks");
    })
    .catch((err) => {
      res.send(err);
    });
});
//Get Prescription
router.get("/prescription/:patientID", isLoggedIn, (req, res) => {
  Patient.findOne({ _id: req.params.patientID }).then((patient) => {
    Prescription.find({ Patient: patient._id })
      .sort({ PrescriptionDate: -1 })
      .then((prescriptionDetails) => {
        res.render("prescription", {
          patient: patient,
          prescriptionDetails: prescriptionDetails,
        });
      })
      .catch((err) => {
        res.send(err);
      });
  });
});

//Get Prescription Register
router.get("/prescriptionRegister/:patientid", isLoggedIn, (req, res) => {
  Diagnosis.find()
    .then((diagnosisDetails) => {
      Medicine.find()
        .then((remarksDetails) => {
          res.render("prescriptionRegister", {
            diagnosisDetails: diagnosisDetails,
            remarksDetails: remarksDetails,
            patientid: req.params.patientid,
          });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Prescription Register
router.post("/prescriptionRegister/:patientid", isLoggedIn, (req, res) => {
  Patient.findOne({ _id: req.params.patientid })
    .then((patientDetails) => {
      const prescription = new Prescription({
        OPD: req.body.opd,
        IPD: req.body.ipd,
        Case: req.body.case,
        ReferralCase: req.body.referral,
        Palliative: req.body.palliative,
        PalliativeCase: req.body.palliativecase,
        Chemotherapy: req.body.chemotherapy,
        ChemoCase: req.body.chemocase,
        PrescriptionDate: req.body.prescDate,
        Diagnosis: req.body.diagnosis,
        RemarkMedicine: req.body.remarks,
        Dr_Name: req.body.DrName,
        Patient: req.params.patientid,
      });
      prescription
        .save()
        .then((prescriptionDetails) => {
          patientDetails.Prescription.push(prescriptionDetails._id);
          patientDetails.save().then(() => {
            const patientid = patientDetails._id;
            res.redirect("/prescription/" + patientid);
          });
        })
        .catch((err) => {
          console.log("first");
          res.send(err);
        });
    })
    .catch((err) => {
      console.log("second");
      res.send(err);
    });
});

//Get Edit Prescription
router.get("/editPrescription/:prescId", isLoggedIn, (req, res) => {
  Prescription.findById(req.params.prescId)
    .then((prescriptionDetails) => {
      Diagnosis.find()
        .then((diagnosisDetails) => {
          Medicine.find()
            .then((remarksDetails) => {
              const prescdate = dateConvert(
                String(prescriptionDetails.PrescriptionDate),
              );
              res.render("prescriptionEdit", {
                diagnosisDetails: diagnosisDetails,
                remarksDetails: remarksDetails,
                patientid: prescriptionDetails.Patient,
                prescriptionDetails: prescriptionDetails,
                prescdate: prescdate,
              });
            })
            .catch((err) => {
              res.send(err);
            });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Edit Prescription
router.post("/editPrescription/:prescId", isLoggedIn, (req, res) => {
  console.log("start");
  Prescription.findOneAndUpdate(
    { _id: req.params.prescId },
    {
      OPD: req.body.opd,
      IPD: req.body.ipd,
      Case: req.body.case,
      ReferralCase: req.body.referral,
      Chemotherapy: req.body.chemotherapy,
      ChemoCase: req.body.chemocase,
      Palliative: req.body.palliative,
      PalliativeCase: req.body.palliativecase,
      PrescriptionDate: req.body.prescDate,
      Diagnosis: req.body.diagnosis,
      RemarkMedicine: req.body.remarks,
      Dr_Name: req.body.DrName,
    },
  )
    .then((prescriptionDetails) => {
      console.log(prescriptionDetails.Patient);
      res.redirect("/prescription/" + prescriptionDetails.Patient);
    })
    .catch((err) => {
      console.log("something went wrong");
      res.send(err);
    });
});

//Delete Prescription
router.get("/deletePrescription/:prescId", isLoggedIn, (req, res) => {
  Prescription.findOneAndDelete({ _id: req.params.prescId })
    .then((prescriptionDetails) => {
      Patient.findOne({ _id: prescriptionDetails.Patient })
        .then((patientDetails) => {
          prescIdIndex = patientDetails.Prescription.indexOf(
            prescriptionDetails._id,
          );
          patientDetails.Prescription.splice(prescIdIndex, 1);
          patientDetails
            .save()
            .then(() => {
              res.redirect("/prescription/" + prescriptionDetails.Patient);
            })
            .catch((err) => {
              res.send(err);
            });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res, send(err);
    });
});

//Get Generate Report
router.get("/generate", isLoggedIn, (req, res) => {
  Prescription.find().then((prescriptionDetails) => {
    res.render("generateReport", {
      prescriptionDetails: prescriptionDetails,
      startdate: "",
    });
  });
});

//Post Generate Report
router.post("/generate", isLoggedIn, (req, res) => {
  const startdate = req.body.startDate;
  const enddate = req.body.endDate;
  if (startdate != "" && enddate != "") {
    if (startdate == enddate) {
      var filterData = {
        PrescriptionDate: startdate,
      };
    } else {
      var filterData = {
        $and: [
          { PrescriptionDate: { $gte: startdate } },
          { PrescriptionDate: { $lte: enddate } },
        ],
      };
    }
  } else {
    var filterData = {};
  }
  Prescription.find(filterData).then((prescriptionDetails) => {
    res.render("generateReport", {
      prescriptionDetails: prescriptionDetails,
      startdate: startdate,
      enddate: enddate,
    });
  });
});

//Get Patient Full Report
router.get("/fullReport", isLoggedIn, (req, res) => {
  Prescription.find()
    .sort({ PrescriptionDate: -1 })
    .then((prescriptionDetails) => {
      Patient.find()
        .then((patientDetails) => {
          Diagnosis.find()
            .then((diagnosisDetails) => {
              res.render("fullReport", {
                prescriptionDetails: prescriptionDetails,
                patientDetails: patientDetails,
                diagnosisDetails: diagnosisDetails,
              });
            })
            .catch((err) => {
              res.send(err);
            });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Post Patient Full Report
router.post("/searchfullReport", isLoggedIn, (req, res) => {
  const startdate = req.body.startDate;
  const enddate = req.body.endDate;
  const mobile = req.body.mobile;
  const diagnosis = req.body.diagnosis;
  if (startdate != "" && enddate != "" && diagnosis == undefined) {
    if (startdate == enddate) {
      var filterData = {
        PrescriptionDate: startdate,
      };
    } else {
      var filterData = {
        $and: [
          { PrescriptionDate: { $gte: startdate } },
          { PrescriptionDate: { $lte: enddate } },
        ],
      };
    }
  } else if (startdate != "" && enddate != "" && diagnosis != "") {
    if (startdate == enddate) {
      var filterData = {
        $and: [{ PrescriptionDate: startdate }, { Diagnosis: diagnosis }],
      };
    } else {
      var filterData = {
        $and: [
          { Diagnosis: diagnosis },
          {
            $and: [
              { PrescriptionDate: { $gte: startdate } },
              { PrescriptionDate: { $lte: enddate } },
            ],
          },
        ],
      };
    }
  } else if (startdate == "" && enddate == "" && diagnosis != "") {
    var filterData = {
      Diagnosis: diagnosis,
    };
  } else {
    var filterData = {};
  }
  if (mobile != "") {
    var filter = { Mobile: mobile };
  } else {
    var filter = {};
  }
  Prescription.find(filterData)
    .sort({ PrescriptionDate: -1 })
    .then((prescriptionDetails) => {
      Patient.find(filter)
        .then((patientDetails) => {
          Diagnosis.find()
            .then((diagnosisDetails) => {
              res.render("fullReport", {
                prescriptionDetails: prescriptionDetails,
                patientDetails: patientDetails,
                diagnosisDetails: diagnosisDetails,
              });
            })
            .catch((err) => {
              res.send(err);
            });
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => {
      res.send(err);
    });
});

//Logout
router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout();
  res.redirect("/");
});

//Authentication
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

function dateConvert(dateString) {
  let strMonth = dateString.slice(4, 7);
  let date = dateString.slice(8, 10);
  let year = dateString.slice(11, 15);
  let objMonth = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  let month = objMonth[strMonth];
  return year + "-" + month + "-" + date;
}

module.exports = router;
