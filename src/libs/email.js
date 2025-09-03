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
    <div style="background: linear-gradient(135deg, #003e70 0%, #00284d 100%); color: #fff; font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border-radius: 12px; border: 1px solid #045389; box-shadow: 0 4px 24px rgba(0, 62, 112, 0.3);">
      <div style="text-align:center;">
        <h2 style="color:#efd9af; margin-bottom:8px; font-size: 1.5rem;">${title}</h2>
      </div>
      <div style="margin: 24px 0; font-size: 1.1rem; line-height:1.7; color: #fff;">
        ${message}
      </div>
      ${action ? `<div style="margin: 32px 0; text-align:center;">${action}</div>` : ''}
      <div style="font-size:0.95rem; color:#d5bb87; margin-top:32px;">${footer}</div>
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
        message: `Hola <b>${fullname}</b>,<br>Gracias por registrarte en nuestra plataforma de análisis y gestión de problemas mediante Matriz Vester. Para activar tu cuenta, ingresa el siguiente código de verificación en la aplicación:`,
        action: `<div style="background:#00284d; color:#efd9af; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px; border: 2px solid #045389;">${code}</div>`,
        footer: 'Este código expira en 30 minutos. Si no solicitaste este registro, ignora este correo.'
      })
    } else if (use === 'authentication') {
      mailOptions.subject = 'Código de acceso a tu cuenta - Matriz Vester'
      mailOptions.html = emailLayout({
        title: 'Verificación de acceso',
        message: `Hola <b>${fullname}</b>,<br>Para completar tu inicio de sesión en la plataforma de Matriz Vester, ingresa el siguiente código en la aplicación:`,
        action: `<div style="background:#00284d; color:#efd9af; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px; border: 2px solid #045389;">${code}</div>`,
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
        message: `Hola <b>${fullname}</b>,<br>Recibimos una solicitud para restablecer tu contraseña de la plataforma Matriz Vester. Haz clic en el siguiente botón para continuar:`,
        action: `<a href="${link}" style="background:#045389; color:#efd9af; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:1.1rem; font-weight:600; display:inline-block; border: 2px solid #b5a27c;">Restablecer contraseña</a></br>`,
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
