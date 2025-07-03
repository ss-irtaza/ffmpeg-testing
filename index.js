const fs = require("fs");
const { exec } = require("child_process");
const formidable = require("formidable"); // Add formidable for file uploads
const archiver = require("archiver");

module.exports = async function (req, res) {
  try {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        fs.writeFileSync("/tmp/log.txt", `Formidable error: ${err}\n`);
        return res.json({ success: false, error: "File upload failed." });
      }

      const input1 = files.video1.filepath;
      const input2 = files.video2.filepath;
      const output = "/tmp/merged.webm"; // Change output format to WebM
      const logFile = "/tmp/log.txt";

      // Merge using FFmpeg
      const command = `ffmpeg -i ${input1} -i ${input2} -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" ${output}`;

      fs.writeFileSync(logFile, `Executing command: ${command}\n`); // Log the FFmpeg command

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", stderr);
          fs.appendFileSync(logFile, `FFmpeg error: ${stderr}\n`);
          return res.json({ success: false, error: stderr });
        }

        fs.appendFileSync(logFile, `FFmpeg stdout: ${stdout}\n`);
        fs.appendFileSync(logFile, `FFmpeg stderr: ${stderr}\n`);

        try {
          const mergedFile = fs.readFileSync(output);
          const logContent = fs.readFileSync(logFile);

          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Content-Disposition", "attachment; filename=merged_with_logs.zip");

          const archive = archiver("zip");

          archive.on("error", (err) => {
            console.error("Archiver error:", err);
            res.status(500).send({ success: false, error: "Failed to create archive." });
          });

          archive.pipe(res);
          archive.append(mergedFile, { name: "merged.webm" });
          archive.append(logContent, { name: "log.txt" });
          archive.finalize();
        } catch (readError) {
          console.error("File read error:", readError);
          fs.appendFileSync(logFile, `File read error: ${readError}\n`);
          res.json({ success: false, error: "Failed to read the merged file." });
        }
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    fs.appendFileSync("/tmp/log.txt", `Unexpected error: ${err.message}\n`);
    res.json({ success: false, error: err.message });
  }
};
