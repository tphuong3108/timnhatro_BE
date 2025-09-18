/* eslint-disable no-console */
const errorHandler = (err, req, res, next) => {
  console.error('error in handle', err)
  if (err.statusCode) {
    res.status(err.statusCode).json({ message: err.message })
  } else {
    res.status(500).json({ message: 'Something went wrong!' })
  }
}

export { errorHandler }
