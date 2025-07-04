const fs = require("fs");
const { exec } = require("child_process");
const formidable = require("formidable");
const ffmpeg = require("fluent-ffmpeg");

module.exports = async function (req, res) {
  try {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        return res.status(500).json({ success: false, error: "File upload failed." });
      }

      const input1 = files.video1?.filepath;
      const input2 = files.video2?.filepath;

      if (!input1 || !input2) {
        return res.status(400).json({ success: false, error: "Both video files are required." });
      }

      try {
        const getDuration = (filePath) => {
          return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
              if (err) return reject(err);
              resolve(metadata.format.duration);
            });
          });
        };

        const duration1 = await getDuration(input1);
        const duration2 = await getDuration(input2);
        const combinedDuration = duration1 + duration2;

        res.json({ success: true, combinedDuration });
      } catch (durationError) {
        console.error("Error calculating video durations:", durationError);
        res.status(500).json({ success: false, error: "Error calculating video durations." });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, error: "Unexpected server error." });
  }
};
