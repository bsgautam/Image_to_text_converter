function generateOtp(length = 6) {
  const digits = '0123456789';
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const allChars = digits + letters;

  if (length < 2) {
    throw new Error('Length must be at least 2 to include both a digit and a letter');
  }

  // Ensure at least one digit and one letter
  let otp = '';
  otp += digits[Math.floor(Math.random() * digits.length)];
  otp += letters[Math.floor(Math.random() * letters.length)];

  // Fill the rest with random characters
  for (let i = 2; i < length; i++) {
    otp += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the characters so guaranteed chars aren't always at start
  otp = otp.split('').sort(() => Math.random() - 0.5).join('');

  return otp;
}

// Example usage:
console.log(generateOtp());   // e.g. "a3c9x1"
console.log(generateOtp(8));  // e.g. "3b7x0m1q"
