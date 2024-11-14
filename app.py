from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI()

@app.get("/clientid")
async def index():
   return {
      "clientid": os.environ['CLIENT_ID']      
      }

app.mount('/', StaticFiles(directory=".", html=True), name="src")