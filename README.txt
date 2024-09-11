Stock Alert

1. create config.json like this:

{
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@example.com",
      "pass": "your-email-password"
    }
  },
  "email": {
    "from": "your-email@example.com",
    "to": "recipient-email@example.com",
    "subject": "RSI Notification: AAPL Stock"
  }
}


2. start: 

pm2 start index.js