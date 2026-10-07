// Định dạng response thống nhất cho toàn bộ API.
//   Thành công: { success: true,  message, data }
//   Thất bại  : { success: false, message, errors }
const success = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const failure = (res, message, statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, errors });

module.exports = { success, failure };
