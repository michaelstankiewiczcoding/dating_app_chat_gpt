curl -X POST "https://fcm.googleapis.com/fcm/send" \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "New Message",
      "body": "You have a new message"
    }
  }'