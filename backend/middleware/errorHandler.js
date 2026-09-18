const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    return res.status(413).json({
      message: 'The uploaded photo or payload is too large. Please select a smaller photo or compress it before submitting.'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size exceeds the 15MB limit. Please select a smaller photo.' });
  }

  const statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
