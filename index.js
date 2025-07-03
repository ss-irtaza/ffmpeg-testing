const fs = require("fs");
const { exec } = require("child_process");

module.exports = async function (req, res) {
  try {
    const input1 = "/tmp/input1.mp4";
    const input2 = "/tmp/input2.mp4";
    const output = "/tmp/merged.mp4";

    // Save the uploaded files to /tmp
    fs.writeFileSync(input1, Buffer.from(req.files.video1));
    fs.writeFileSync(input2, Buffer.from(req.files.video2));

    // Merge using FFmpeg
    const command = `ffmpeg -i ${input1} -i ${input2} -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" ${output}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("FFmpeg error:", stderr);
        return res.json({ success: false, error: stderr });
      }

      const mergedFile = fs.readFileSync(output);
      res.setHeader("Content-Type", "video/mp4");
      res.send(mergedFile);
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
