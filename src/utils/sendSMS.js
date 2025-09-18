/* eslint-disable no-console */
import { twilioClient } from '~/config/twilio.js'
import { env } from '~/config/environment.js'
import ApiError from './ApiError'
import { PHONE_RULE } from './validators'

const normalizePhoneNumber = (phone) => {
  const match = PHONE_RULE.test(phone)
  if (!match) {
    throw new ApiError(400, 'Invalid phone number format')
  }
  return `+84${phone.slice(1)}`
}

const sendSMS = async (to, body) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: env.TWILIO_PHONE_NUMBER,
      to: normalizePhoneNumber(to)
    })

    return message
  } catch (error) {
    console.error('Error sending SMS:', error.message)
    throw new ApiError(500, 'Failed to send SMS')
  }
}

export default sendSMS