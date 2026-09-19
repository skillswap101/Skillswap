import json

service_account_data = {
  "type": "service_account",
  "project_id": "skillswapapp-905ca",
  "private_key_id": "a0d57ffd7e7a153ab6d6864a7cd2baf1d601ae7a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDO894xUBSGDq1y\nroKo787qZpQ/5V6HRlK94CXwLqZcHkaqNsMm+ThDxlYAW3wrnsvP5ebbTWn68FLM\n9uHyOIt+63ooqhOtmavusswThLYgqGsdBQpgOF8zjPs/cFAwGVaa5wRsf50INdRo\nwaq10/zIOiIyZY/kFC2tSBvWzsxBvK5gi6bZkTDjaTqSC1zV4lDoC07cMh0yBY0V\nF0WrSOq60vhyEl7osHhR0LDJiuZA77L7QEmUoNKDJHCgmmHii4P6IdhIo+gR047o\nWgvnwynyXk2Mm8MnTGhD9DTdb4K7VB5AfdOwlkGfYFgYhBUw1EhBKlg8WTO89ZHb\nGKCbH6XvAgMBAAECggEACZMxOmEvnzzfm9jkylx/W3X6hvLy9YRJ62dgVKVROh2G\nfHVDKzLy/k5ssosztVryqBWazEEKgGXibCxCAPB1InP892kDDGWklaB9Hla7YcsZ\nBZiIRd0QfontIp7CKa+KbmlLhETqkYjYC9lmBLqgTUKZ9sX0gIN0fOTDW6QUFuMc\nExGojB556RLMP6x6f7aTPnKTj3QrNZwMPjLJLfLlXdPJw18ZaPH9XBhucIxDOf9y\nUHJTFQib5Fg0YWepf6btONS5L0QrV3nNmno2ucw8BC9BiFc7QHbcxNv9AsUjIrI4\nfWY+tq2agYaZqCnmX1otwt4ErZaW79pUeCInlYZ+1QKBgQD3Rtd1+XXHJukILIUD\n2/uvAmEsTIbZa2QiRsT6lR9MCqUy2RJroAxFhBtUbkKRtEsT+rdiob0UO3hS3DfG\nlI5BJUKW91e+EdxOmUa2GjyvpuoZ6UKJ27nwFzhkwngUNv6n4OGJEYqsuURL+FnO\nAAhOM13LWfIL944094nj8G4CqwKBgQDWQNvcv2AJV+pPUMrnFKFVq7SwFpgHjiBe\nBb79njnjS5kLTsVgLZrQtHtpeQpZ2KuEkjCLtUTl7EG3yGfvC3r4lVvQOh7J9vng\nOFoGyo9ChdO2t/Rv4CC2Bxll+LRRwU2Ur+VXIx7JnP/83TV5z+Ws8GT7PKl/56GB\nsEVoKs6JzQKBgQDecydvpSw0Lafjx5Ed6K9hQGXEoU+KllatkzavKqnOEaGNvcQZ\neBCyFOc1LD/MrgIAhkKlg1UCt4FGIYA3r/rNVkSyZO7VOWIUf0UimzXO2vystLA8\nLqP1/h2oX14A6Xxr8B1U3qf/PGfZZCD99f+Cwij1wAPEij6vHaU5nliJIwKBgFTU\nTjZnNCWOnNE7dEoXehpn5TInVEAeNhBNil8aDcSS3oqqgM2i0Fu9B4CipKgMui+\naPInxyuxqyN0+ZGv3fRmTn/XQzF709tu9FYUBTy1d+m0U9enycvIa8nv+pUUD/96\n1Tb29M2ml8QqYW3lXm5mj9TZY9L8hvmuLQzdRgFRAoGAa6i6eAPN4EwmOw1H9aiP\nl9zlbI2TvlSH5IJxDJ1Fj8k9Qd/m2Jty6rzNBwU6FIJpxUHsigm+UCKI4yivPTW8\nMtMkR2A9rNszQ2H73c9iCXYJ3O02u9FmB1w6SWDZCokyHJuodMPiVUVhzqGnQp36\nx0CDdEYgXa8cQkTt4+JMWB4=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@skillswapapp-905ca.iam.gserviceaccount.com",
  "client_id": "105713208031240278421",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40skillswapapp-905ca.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

env_path = ".env"

base_env = """PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-bb8bb763106f180b50e7d2f04241c2a8520e021838e3826b06199f840cc

# Gemini API Key
GEMINI_API_KEY=AQ.Ab8RN6LuJHFm8EAbacXITVhLUXGSWnCymPM9iKLLWHw4u4ypTA

# Stripe API Gateway Secret Keys
STRIPE_SECRET_KEY=sk_test_51TI8HUEjnOIMX6eha9FijQPVMSS7EEVlOEf32Ysiy2RvERQcUzQOnmvFUnxn
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# Unified Vite Frontend Firebase Keys
VITE_FIREBASE_API_KEY=AIzaSyDILiPgriu8dkKMxLp8zqPqLEIK9vcvtC8
VITE_FIREBASE_AUTH_DOMAIN=skillswapapp-905ca.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=skillswapapp-905ca
VITE_FIREBASE_STORAGE_BUCKET=skillswapapp-905ca.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=934795961841
VITE_FIREBASE_APP_ID=1:934795961841:web:10eeaaed65cd0aa6a45050
"""

env_json_string = json.dumps(service_account_data)

with open(env_path, "w", encoding="utf-8") as f:
    f.write(base_env)
    f.write(f"FIREBASE_SERVICE_ACCOUNT='{env_json_string}'\n")

print(".env file successfully rebuilt and fixed!")
