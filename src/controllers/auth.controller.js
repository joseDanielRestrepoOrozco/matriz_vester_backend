import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import { createAccessToken } from '../libs/jwt.js'
import config from '../config.js'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ⚠️ Esto permite certificados autofirmados
  }
});

const generateVerificationCode = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para obtener el layout base del email
function emailLayout({ title, message, action, footer }) {
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
  `;
}

// Función para enviar el correo electrónico con el código de verificación o autenticación
const sendEmail = async (email, code, fullname, use) => {
  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '',
    html: '',
  };

  try {
    if (use === 'verification') {
      mailOptions.subject = 'Confirma tu registro en Matriz Vester';
      mailOptions.html = emailLayout({
        title: '¡Bienvenido a Matriz Vester!',
        message: `Hola <b>${fullname}</b>,<br>Gracias por registrarte. Para activar tu cuenta, ingresa el siguiente código de verificación en la app:`,
        action: `<div style="background:#18181b; color:#2563eb; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px;">${code}</div>`,
        footer: 'Este código expira en 30 minutos. Si no solicitaste este registro, ignora este correo.'
      });
    } else if (use === 'authentication') {
      mailOptions.subject = 'Código de acceso a tu cuenta - Matriz Vester';
      mailOptions.html = emailLayout({
        title: 'Verificación de acceso',
        message: `Hola <b>${fullname}</b>,<br>Para completar tu inicio de sesión, ingresa el siguiente código en la app:`,
        action: `<div style="background:#18181b; color:#2563eb; display:inline-block; padding:16px 32px; border-radius:8px; font-size:2rem; font-weight:bold; letter-spacing:6px;">${code}</div>`,
        footer: 'Este código expira en 15 minutos. Si no solicitaste este acceso, ignora este correo.'
      });
    } else {
      throw new Error("Uso de correo inválido: debe ser 'verification' o 'authentication'");
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error enviando el email:', error);
    return false;
  }
};

export const register = async (req, res, next) => {
  const { username, email, password } = req.body

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = await generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000)

    const user = new User({
      username,
      email,
      passwordHash,
      verificationCode,
      verificationCodeExpires
    })

    const savedUser = await user.save()

    // Enviar email con el código de verificación
    await sendEmail(email, verificationCode, username, "verification")

    res.status(201).json(savedUser)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  let { email, password } = req.body;
  // Validaciones con regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[a-zA-Z\d\W]{7,}$/;
  if (email) {
    email = email.toLowerCase().trim();
  }
  if (!email || !password) {
    return res.status(400).json({ message: "Both fields are required" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must contain at least one uppercase letter, one lowercase letter, one number and be at least 7 characters long" });
  }
  try {
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(404).json({ message: "user not found" });
    }
    const validPassword = await bcrypt.compare(password, userFound.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: "Contraseña" });
    }
    // Generar código y expiración
    const newCode = await generateVerificationCode();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
    userFound.verificationCode = newCode;
    userFound.verificationCodeExpires = expirationTime;
    await userFound.save();
    // Solo email
    const emailSent = await sendEmail(email, newCode, userFound.username, "authentication");
    if (emailSent) {
      return res.status(200).json({ message: "Check the code sent to your email" });
    } else {
      return res.status(500).json({ message: "Error sending email" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error" + error });
  }
}

export const logout = (req, res) => {
  res.status(200).end()
}

export const verifyToken = async (req, res, next) => {
  const token = req.token

  try {
    if (!token) return res.status(401).end()

    const decodedUser = jwt.verify(token, config.SECRET)

    const userFound = await User.findById(decodedUser.id)

    if (!userFound) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const newToken = await createAccessToken({ id: userFound._id })

    res.status(200).json(userFound)
  } catch (error) {
    next(error)
  }
}

export const verifyCode = async (req, res, next) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    if (user.status === 'ACTIVE') {
      return res.status(400).json({ error: 'account already verified' });
    }
    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ error: 'there is not registered verification code' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'wrong code' });
    }
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: 'code has expired' });
    }
    user.status = 'ACTIVE';
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    // Firmar el token aquí
    const token = await createAccessToken({ id: user._id });
    res.status(200).json({ message: 'verification successful', token });
  } catch (error) {
    next(error);
  }
}

export const secondFactorAuthentication = async (req, res) => {
  const { code, email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const now = new Date();
    if (!user.verificationCodeExpires || now > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "Authentication code has expired.",
      });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({
        message: "Invalid authentication code",
      });
    }
    // Generar token de autenticación solo con la id
    const token = await createAccessToken({ id: user._id });
    res.status(200).json({
      message: "Login successfull",
      token
    });
  } catch (error) {
    res.status(500).json({
      message: "Authentication failed", error: error.message,
    });
  }
}

export const resetPassword = async (req, res) => {
  let { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  // Token solo válido por 1 horas
  const token = await createAccessToken({ userId: user._id }, { expiresIn: '1h' });
  const resetLink = `${process.env.FRONTEND_URL}/changeResetPassword/${token}`;
  try {
    await sendPassVerificationEmail(user.email, resetLink, user.username);
    res.status(200).json({ message: 'Reset email sent' });
  } catch (error) {
    console.log("Error sending link:", error);
    res.status(500).json({ message: "Failed to send verification link", error: error.message });
  }
}

export const sendPassVerificationEmail = async (email, link, fullname) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Restablece tu contraseña - Matriz Vester',
      html: emailLayout({
        title: 'Restablecimiento de contraseña',
        message: `Hola <b>${fullname}</b>,<br>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:`,
        action: `<a href="${link}" style="background:#2563eb; color:#fff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:1.1rem; font-weight:600; display:inline-block;">Restablecer contraseña</a></br>`,
        footer: 'Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.'
      })
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export const changeResetPassword = async (req, res) => {
  const { token, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "The new password don't match" });
  }
  try {
    // Decodifica el token usando jwt.verify directamente, no verifyToken middleware
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const password = await bcrypt.hash(newPassword, 10);
    user.passwordHash = password;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
}