const { classifyImage } = require('../services/aiClassifier');

const classifyWaste = async (req, res, next) => {
  try {
    const filename = req.file ? req.file.filename : req.body.image_name;
    if (!filename) return res.status(400).json({ message: 'Image file or name required' });
    
    const result = await classifyImage(filename);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { classifyWaste };
