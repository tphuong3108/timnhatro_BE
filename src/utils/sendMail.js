import { nodemailerTransporter } from '~/config/nodemailer.js'
import { env } from '~/config/environment.js'

const sendMail = (to, subject, text) => {
  try {
    const mailOptions = {
      from: env.EMAIL_USER,
      to,
      subject,
      text
    }
    return nodemailerTransporter.sendMail(mailOptions)
  } catch (error) {
    throw new Error('Failed to send email')
  }
}

export default sendMail