const s3 = require("./config/s3.config");
const cloudinary = require("./config/cloudinary");

exports.doUpload = async (req, res) => {
  const { s3Client } = s3;
  const params = s3.uploadParams;

  // originalname = originalname + Date.now() + originalname;
  // params.Key =
  //   Date.now() + req.file ? req.file.originalname : req.files.file.name;
  // console.log("key", params.Key);
  // params.Body = req.file ? req.file.buffer : req.files.file.data;

  // s3Client.upload(params, (err, data) => {
  //   if (err) {
  //     res.status(500).json({ error: `Error -> ${err}` });
  //   }
  //   if (req.profileUpload) {
  //     return data.Location;
  //   }
  //   res.status(201).json({
  //     status: "success",
  //     message: data.Location,
  //   });
  // });
  const { path } = req.file;
  let link = await cloudinary.upload(path);
  if (req.profileUpload) {
    return link;
  }
  res.send({ error: false, message: "File uploaded", link });
};

exports.doMultipleUpload = async (req, res) => {
  const { s3Client } = s3;
  const params = s3.uploadParams;
  const files = [];
  if (req.files.length != 0) {
    for (let ele of req.files) {
      // params.Key = Date.now() + ele.file.name;
      // console.log("key", params.Key);
      // params.Body = ele.file.data;
      // s3Client.upload(params, (err, data) => {
      //   if (err) {
      //     res.status(500).json({ error: `Error -> ${err}` });
      //   }
      //   files.push(data.Location);
      // });
      const { path } = ele;
      let link = await cloudinary.upload(path);
      files.push(link);
    }
    if (req.profileUpload) {
      return files;
    }
    res.status(201).json({
      status: "success",
      message: files,
    });
  }
};

exports.deleteObject = (req, res) => {
  const { s3Client } = s3;
  const params = s3.uploadParams;
  const { link } = req.params;

  // eslint-disable-next-line prefer-destructuring
  params.Key = link.split("/")[3];

  s3Client.deleteObject(params, (err, data) => {
    if (err) {
      res.status(500).json({ error: `Error -> ${err}` });
    }
    res.status(201).json({
      status: "success",
      data,
    });
  });
};
