function landIdError(id) {
  id = (id || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9\-\/]{2,19}$/.test(id)) return "Land ID must be 3-20 characters: letters, numbers, - or / (e.g. 362 or SY-101).";
  if (!/[1-9]/.test(id)) return "Enter a real survey number. A Land ID of only zeros is not valid.";
  if (/^(.)\1+$/.test(id)) return "Land ID cannot be one character repeated.";
  return "";
}
function passwordError(pw) {
  pw = pw || "";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password needs both letters and numbers.";
  if (/(password|qwerty|123456|abcdef|letmein)/i.test(pw)) return "Password is too easy to guess.";
  return "";
}
module.exports = { landIdError, passwordError };
