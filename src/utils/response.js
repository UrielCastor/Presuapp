/**
 * Consistent API response formatter
 */
const formatResponse = (success, data = null, message = '', error = null) => {
  return {
    success,
    data,
    message,
    error
  };
};

module.exports = { formatResponse };
