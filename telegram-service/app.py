from flask import Flask, request, jsonify
from telethon import TelegramClient
from dotenv import load_dotenv
import os
import asyncio
import threading


load_dotenv()

app = Flask(__name__)


api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")
bot = os.getenv("BOT_USERNAME")
phone = os.getenv("PHONE")


client = TelegramClient(
    "telegram.session",
    api_id,
    api_hash
)


loop = asyncio.new_event_loop()


def start_loop():
    asyncio.set_event_loop(loop)
    loop.run_forever()


threading.Thread(
    target=start_loop,
    daemon=True
).start()



async def connect_telegram():

    if not client.is_connected():
        await client.connect()

    if not await client.is_user_authorized():
        await client.start(phone)


async def check_email(email):

    await connect_telegram()


    await client.send_message(
        bot,
        email
    )


    await asyncio.sleep(3)


    messages = await client.get_messages(
        bot,
        limit=5
    )


    for msg in messages:

        if not msg.text:
            continue


        text = msg.text



        # البريد موجود في فالدكس
        if (
            "هذا البريد الإلكتروني مسجل بالفعل" in text
            or
            "This email is already registered" in text
        ):
            return {
                "success": True,
                "registered": True,
                "message": text
            }


        # البريد غير موجود في فالدكس
        if (
            "تم قبول البريد الإلكتروني" in text
            or
            "Email accepted" in text
        ):
            return {
                "success": True,
                "registered": False,
                "message": text
            }


    return {
        "success": False,
        "message": "لم يتم العثور على رد"
    }



@app.post("/check-email")
def check_email_api():

    data = request.get_json()

    email = data.get("email")


    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }),400


    future = asyncio.run_coroutine_threadsafe(
        check_email(email),
        loop
    )


    result = future.result()


    return jsonify(result)



if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )