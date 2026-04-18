const { spawn } = require("child_process");
const path = require("path");

exports.predictIrrigation = (sensorData) => {
  return new Promise((resolve, reject) => {

    const py = spawn("python", [
      path.join(__dirname, "predict.py"),
      JSON.stringify(sensorData)
    ]);

    let result = "";

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (err) => {
      console.error("Python error:", err.toString());
    });

    py.on("close", () => {
      try {
        resolve(JSON.parse(result));
      } catch (e) {
        reject("Invalid ML response");
      }
    });

    py.on("error", (err) => reject(err));
  });
};