import nodemailer from 'nodemailer'
import config from '../config.js'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})

export const generateVerificationCode = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Función para obtener el layout base del email
export function emailLayout ({ title, message, action, footer }) {
  return `
    <div style="background: linear-gradient(135deg, #0f172a 0%, #000 100%); color: #fff; font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border-radius: 12px; border: 1px solid #222; box-shadow: 0 4px 24px #0002;">
      <div style="text-align:center;">
        <h2 style="color:#fff; margin-bottom:8px; font-size: 1.5rem;">${title}</h2>
      </div>
      <div style="margin: 24px 0; font-size: 1.1rem; line-height:1.7;">
        ${message}
      </div>
      ${action ? `<div style="margin: 32px 0; text-align:center;">${action}</div>` : ''}
      <div style="font-size:0.95rem; color:#94a3b8; margin-top:32px;">${footer}</div>
    </div>
  `
}

// Función para enviar el correo electrónico con el código de verificación o autenticación
export const sendEmail = async (email, code, fullname, use) => {
  const mailOptions = {
    from: config.EMAIL_USER,
    to: email,
    subject: '',
    html: ''
  }

  try {
    if (use === 'verification') {
      mailOptions.subject = 'Confirma tu registro en Matriz Vester'
      mailOptions.html = emailLayout({
        title: '¡Bienvenido a Matriz Vester!',
        message: `Hola <b>${fullname}</b>,<br>Gracias por registrarte. Para activar tu cuenta, ingresa el siguiente código de verificación en la app:`,
        action: `<div style="background:#18181b; color:#2563eb; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px;">${code}</div>`,
        footer: 'Este código expira en 30 minutos. Si no solicitaste este registro, ignora este correo.'
      })
    } else if (use === 'authentication') {
      mailOptions.subject = 'Código de acceso a tu cuenta - Matriz Vester'
      mailOptions.html = emailLayout({
        title: 'Verificación de acceso',
        message: `Hola <b>${fullname}</b>,<br>Para completar tu inicio de sesión, ingresa el siguiente código en la app:`,
        action: `<div style="background:#18181b; color:#2563eb; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px;">${code}</div>`,
        footer: 'Este código expira en 15 minutos. Si no solicitaste este acceso, ignora este correo.'
      })
    } else {
      throw new Error("Uso de correo inválido: debe ser 'verification' o 'authentication'")
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado: ' + info.response)
    return true
  } catch (error) {
    console.error('Error enviando el email:', error)
    return false
  }
}

// Función para enviar correo de restablecimiento de contraseña
export const sendPassVerificationEmail = async (email, link, fullname) => {
  try {
    const mailOptions = {
      from: config.EMAIL_USER,
      to: email,
      subject: 'Restablece tu contraseña - Matriz Vester',
      html: emailLayout({
        title: 'Restablecimiento de contraseña',
        message: `Hola <b>${fullname}</b>,<br>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:`,
        action: `<a href="${link}" style="background:#2563eb; color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:1.1rem; font-weight:600; display:inline-block;">Restablecer contraseña</a></br>`,
        footer: 'Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.'
      })
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado: ' + info.response)
    return true
  } catch (error) {
    console.error('Error enviando el correo de restablecimiento:', error)
    return false
  }
}
