// testMailer.js
const { sendEmail } = require("./utils/mailer");

async function testEmail() {
  try {
    const info = await sendEmail({
      to: "recipient@example.com", // Use any email address for testing
      subject: "Test Email from Mailtrap",
      text: "This is a test email sent via Mailtrap.",
      html: "<h1>This is a test email sent via Mailtrap.</h1>",
    });
    console.log("Test email sent. Message ID:", info.messageId);
    // Optionally log the preview URL if available
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Test email failed:", error);
  }
}

testEmail();
