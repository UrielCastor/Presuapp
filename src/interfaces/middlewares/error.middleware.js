const { formatResponse } = require('../../utils/response');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = 400;
  }

  // Handle unauthorized use-case errors
  const lowerMsg = (err.message || '').toLowerCase();
  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('unathorized')) {
    error = new Error('Acceso denegado. No tenés permisos para interactuar con este recurso.');
    error.statusCode = 403;
  }

  // Handle not found resources
  if (lowerMsg.includes('not found') || lowerMsg.includes('missing')) {
    error = new Error('El recurso solicitado no fue encontrado.');
    error.statusCode = 404;
  }

  res.status(error.statusCode || 500).json(
    formatResponse(false, null, error.message || 'Server Error', error.message)
  );
};

module.exports = { errorHandler };
