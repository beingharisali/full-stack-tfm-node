const notFound = (req, res, next) => {
  const error = new Error(
    `Cannot find ${req.originalUrl} route on ${req.method} request`
  );
  error.statusCode = 404;
  next(error);
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  res.status(err.statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};

module.exports = { notFound, globalErrorHandler };
