const fs = require("fs");
const { exec } = require("child_process");
const formidable = require("formidable");

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

      const output = "/tmp/merged_output.webm";
      const command = `ffmpeg -i ${input1} -i ${input2} -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" ${output}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", stderr);
          return res.status(500).json({ success: false, error: "Video merging failed." });
        }

        fs.access(output, fs.constants.F_OK, (accessErr) => {
          if (accessErr) {
            console.error("Output file does not exist:", accessErr);
            return res.status(500).json({ success: false, error: "Merged file not found." });
          }

          res.setHeader("Content-Type", "video/webm");
          res.setHeader("Content-Disposition", "attachment; filename=merged_output.webm");

          const readStream = fs.createReadStream(output);
          readStream.on("error", (readError) => {
            console.error("File read error:", readError);
            res.status(500).json({ success: false, error: "Failed to read the merged file." });
          });

          readStream.pipe(res);
        });
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, error: "An unexpected error occurred." });
  }
};
