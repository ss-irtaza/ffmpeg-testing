const fs = require("fs");
const { exec } = require("child_process");
const formidable = require("formidable");

module.exports = async function (req, res) {
  try {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        return res.status(500).json({ success: false, error: "File upload failed." });
      }

      const input1 = files.video1.filepath;
      const input2 = files.video2.filepath;
      const output = "/tmp/merged.webm";

      // Merge using FFmpeg
      const command = `ffmpeg -i ${input1} -i ${input2} -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" ${output}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", stderr);
          return res.status(500).json({ success: false, error: "Video merging failed." });
        }

        console.log("FFmpeg stdout:", stdout);
        console.log("FFmpeg stderr:", stderr);

        // Ensure the output file exists and is valid
        fs.access(output, fs.constants.F_OK, (accessErr) => {
          if (accessErr) {
            console.error("Output file does not exist:", accessErr);
            return res.status(500).json({ success: false, error: "Merged file not found." });
          }

          // Check the size of the output file
          fs.stat(output, (statErr, stats) => {
            if (statErr) {
              console.error("File stat error:", statErr);
              return res.status(500).json({ success: false, error: "Failed to retrieve file stats." });
            }

            console.log("Merged file size:", stats.size);

            if (stats.size < 1000) { // Arbitrary threshold for debugging
              console.error("Merged file size is too small, indicating an issue.");
              return res.status(500).json({ success: false, error: "Merged file size is too small." });
            }

            // Stream the merged video file back to the client
            res.setHeader("Content-Type", "video/webm");
            res.setHeader("Content-Disposition", "attachment; filename=merged_output.webm");

            const readStream = fs.createReadStream(output);
            readStream.on("error", (readError) => {
              console.error("File read error:", readError);
              res.status(500).json({ success: false, error: "Failed to read the merged file." });
            });

            readStream.on("open", () => {
              console.log("Streaming the merged file to the client.");
            });

            readStream.pipe(res);
          });
        });
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, error: "An unexpected error occurred." });
  }
};
