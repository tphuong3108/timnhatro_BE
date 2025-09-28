import nodemailer from 'nodemailer'
import { env } from '~/config/environment.js'

export const nodemailerTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  }
})