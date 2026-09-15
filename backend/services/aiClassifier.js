const classifyImage = async (filename) => {
  // MOCK AI CLASSIFIER SERVICE
  // In a real application, this would call an external ML model API (e.g., Google Cloud Vision, AWS Rekognition)
  
  const lowerName = filename.toLowerCase();
  let category = 'Other';
  let confidence = Math.random() * (95 - 70) + 70;
  let alternatives = [];

  if (lowerName.includes('bottle') || lowerName.includes('plastic')) {
    category = 'Plastic';
    alternatives = ['Glass'];
  } else if (lowerName.includes('paper') || lowerName.includes('news')) {
    category = 'Paper';
    alternatives = ['Cardboard'];
  } else if (lowerName.includes('box') || lowerName.includes('cardboard')) {
    category = 'Cardboard';
    alternatives = ['Paper'];
  } else if (lowerName.includes('phone') || lowerName.includes('laptop') || lowerName.includes('wire')) {
    category = 'E-Waste';
    alternatives = ['Metal', 'Plastic'];
  } else if (lowerName.includes('can') || lowerName.includes('metal')) {
    category = 'Metal';
    alternatives = ['Plastic'];
  } else if (lowerName.includes('glass') || lowerName.includes('jar')) {
    category = 'Glass';
    alternatives = ['Plastic'];
  } else {
    const categories = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste', 'Cardboard'];
    category = categories[Math.floor(Math.random() * categories.length)];
  }

  return {
    predicted_category: category,
    confidence: parseFloat(confidence.toFixed(2)),
    alternatives,
    is_mock: true
  };
};

module.exports = { classifyImage };
