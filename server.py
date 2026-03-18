from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
# IMPORTANT: This allows any origin. For production, specify your Lovable domain.
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Groq Client
# Replace with your actual key if different
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "gsk_redacted")
client = Groq(api_key=GROQ_API_KEY)

# SMTP Configuration
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "redacted@gmail.com"
SMTP_PASS = "redacted"

@app.route("/", methods=["GET"])
def index():
    return jsonify({"status": "Flow Weaver AI Server is Live", "version": "1.1.0"})

@app.route("/chat", methods=["POST"])
def chat():
    # Log incoming request for debugging on PythonAnywhere
    print("--- Incoming Chat Request ---")
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload received"}), 400
        
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a specialized JSON workflow architect. Return ONLY valid JSON. No markdown, no conversational text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2048 # Explicitly set limit to avoid token error
        )
        response_content = completion.choices[0].message.content
        print(f"Groq Response received, length: {len(response_content)}")
        return response_content
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        return jsonify({"error": f"Groq Error: {str(e)}"}), 500

@app.route("/send_email", methods=["POST"])
def email_get_route():
    data = request.get_json()
    to_email = data.get("email")
    message = data.get("message")
    
    if not to_email or not message:
        return jsonify({"error": "Email and message required"}), 400

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = "Flow Weaver Notification"
        msg.attach(MIMEText(message, 'plain'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.set_debuglevel(1)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"SMTP Error: {str(e)}")
        return jsonify({"error": f"SMTP Error: {str(e)}"}), 500

if __name__ == "__main__":
    # Local fallback
    app.run(host="0.0.0.0", port=5000, debug=True)
