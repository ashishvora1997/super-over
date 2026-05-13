export const getOTPEmailTemplate = (userName: string, otpCode: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .heading {
      color: #1a1a1a;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
    }

    .otp-container {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }

    .otp-code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #1a1a1a;
      margin: 0;
    }
  </style>
</head>

<body>
  <div class="container">
    <h2 class="heading">Verify Your Email</h2>

    <p>
      Hi ${userName},
      <br /><br />
      Thank you for signing up!
    </p>

    <div class="otp-container">
      <p>Your verification code</p>
      <p class="otp-code">${otpCode}</p>
    </div>

    <p>This code expires in 10 minutes.</p>
  </div>
</body>
</html>
  `;
};
