from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/api")
async def index():
   return {
      "message": "Hello World",
      "code":11
      }

app.mount('/', StaticFiles(directory=".", html=True), name="src")