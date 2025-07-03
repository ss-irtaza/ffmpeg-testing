const fs = require("fs");
const { exec } = require("child_process");
const formidable = require("formidable"); // Add formidable for file uploads

module.exports = async function (req, res) {
  try {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        return res.json({ success: false, error: "File upload failed." });
      }

      const input1 = files.video1.filepath;
      const input2 = files.video2.filepath;
      const output = "/tmp/merged.webm"; // Change output format to WebM

      // Merge using FFmpeg
      const command = `ffmpeg -i ${input1} -i ${input2} -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" ${output}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", stderr);
          return res.json({ success: false, error: stderr });
        }

        const mergedFile = fs.readFileSync(output);
        res.setHeader("Content-Type", "video/webm"); // Update Content-Type to WebM
        res.send(mergedFile);
      });
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
