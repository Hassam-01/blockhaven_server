import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

export interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
}

export interface PasswordResetEmailData {
    email: string;
    firstName: string;
    resetToken: string;
}

export interface TwoFactorEmailData {
    email: string;
    firstName: string;
    code: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendContactFormEmail(contactData: ContactFormData): Promise<void> {
        try {
            const { name, email, phone, subject, message } = contactData;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">New Contact Form Submission</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="color: #495057; margin-top: 0;">Contact Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057; width: 30%;">Name:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Email:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${email}</td>
                            </tr>
                            ${phone ? `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Phone:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${phone}</td>
                            </tr>
                            ` : ''}
                            ${subject ? `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Subject:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${subject}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <h3 style="color: #495057; margin-top: 0;">Message</h3>
                        <p style="color: #212529; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0;">
                            This email was sent from your BlockHeaven contact form<br>
                            Received on: ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            `;

            const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}

Received on: ${new Date().toLocaleString()}
            `;

            const mailOptions = {
                from: `"BlockHeaven Contact Form" <${process.env.SMTP_FROM_EMAIL}>`,
                to: process.env.CONTACT_RECEIVE_EMAIL,
                subject: subject ? `Contact Form: ${subject}` : `New Contact Form Submission from ${name}`,
                text: textContent,
                html: htmlContent,
                replyTo: email, // This allows you to reply directly to the person who submitted the form
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Contact form email sent successfully for ${name} (${email})`);
        } catch (error) {
            console.error("Error sending contact form email:", error);
            throw new Error("Failed to send contact form email");
        }
    }

    async sendPasswordResetEmail(resetData: PasswordResetEmailData): Promise<void> {
        try {
            const { email, firstName, resetToken } = resetData;
            const resetUrl = `${process.env.WEB_HOST || 'blockhaven.co'}/reset-password?token=${resetToken}`;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <p style="color: #495057; margin: 0 0 15px 0;">Hello ${firstName},</p>
                        
                        <p style="color: #495057; margin: 0 0 15px 0;">
                            We received a request to reset your password for your BlockHeaven account. 
                            If you didn't make this request, you can safely ignore this email.
                        </p>
                        
                        <p style="color: #495057; margin: 0 0 20px 0;">
                            To reset your password, click the button below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #6c757d; font-size: 14px; margin: 20px 0 0 0;">
                            Or copy and paste this link in your browser:
                            <br>
                            <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
                        </p>
                        
                        <p style="color: #dc3545; font-size: 14px; margin: 20px 0 0 0;">
                            <strong>This link will expire in 1 hour.</strong>
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
                            If you're having trouble clicking the button, copy and paste the URL above into your web browser.
                            <br><br>
                            This email was sent from BlockHeaven. If you have any questions, please contact our support team.
                        </p>
                    </div>
                </div>
            `;

            const textContent = `
                Password Reset Request
                
                Hello ${firstName},
                
                We received a request to reset your password for your BlockHeaven account.
                If you didn't make this request, you can safely ignore this email.
                
                To reset your password, visit the following link:
                ${resetUrl}
                
                This link will expire in 1 hour.
                
                If you're having trouble with the link, copy and paste it into your web browser.
                
                Best regards,
                BlockHeaven Team
            `;

            const mailOptions = {
                from: `"BlockHeaven Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: "Password Reset Request - BlockHeaven",
                text: textContent,
                html: htmlContent,
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Password reset email sent successfully to ${email}`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            throw new Error("Failed to send password reset email");
        }
    }

    async sendTwoFactorCode(twoFactorData: TwoFactorEmailData): Promise<void> {
        try {
            const { email, firstName, code } = twoFactorData;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">BlockHeaven</h1>
                        <h2 style="color: #666; margin: 10px 0; font-weight: normal;">Two-Factor Authentication</h2>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                        <h3 style="color: #333; margin: 0 0 20px 0;">Hello ${firstName},</h3>
                        <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">
                            You are attempting to log in to your BlockHeaven account. Please use the verification code below:
                        </p>
                        
                        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                        </div>
                        
                        <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
                            This code will expire in 10 minutes for security reasons.
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <p style="color: #856404; margin: 0; font-size: 14px;">
                            <strong>Security Notice:</strong> If you did not request this code, please ignore this email and ensure your account is secure.
                        </p>
                    </div>
                    
                    <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p style="margin: 0;">This is an automated message from BlockHeaven. Please do not reply to this email.</p>
                        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} BlockHeaven. All rights reserved.</p>
                    </div>
                </div>
            `;

            const textContent = `
                BlockHeaven - Two-Factor Authentication

                Hello ${firstName},

                You are attempting to log in to your BlockHeaven account. Please use the verification code below:

                Verification Code: ${code}

                This code will expire in 10 minutes for security reasons.

                Security Notice: If you did not request this code, please ignore this email and ensure your account is secure.

                This is an automated message from BlockHeaven. Please do not reply to this email.
                © ${new Date().getFullYear()} BlockHeaven. All rights reserved.
            `;

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: "Two-Factor Authentication Code - BlockHeaven",
                text: textContent,
                html: htmlContent,
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Two-factor authentication code sent successfully to ${email}`);
        } catch (error) {
            console.error("Error sending two-factor authentication email:", error);
            throw new Error("Failed to send two-factor authentication email");
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log("SMTP connection verified successfully");
            return true;
        } catch (error) {
            console.error("SMTP connection verification failed:", error);
            return false;
        }
    }
}

export const emailService = new EmailService();