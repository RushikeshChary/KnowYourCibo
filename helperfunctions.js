

const rgbStringToColorName = (rgbString) => {
    if (!rgbString) {
      // Handle null or undefined rgbString
      return "unknown"; // Or you can throw an error here
    }
    
    const rgbValues = rgbString.match(/\d+/g).map(Number);
    if (rgbValues[0] === 128 && rgbValues[1] === 128 && rgbValues[2] === 128) {
      return "grey";
    } else {
      return "unknown"; // Or handle other cases accordingly
    }
  };
  

module.exports = {rgbStringToColorName};