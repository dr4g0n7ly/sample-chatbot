from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json, uvicorn, uuid
from asyncio import sleep

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

map = {}

async def waypoints_generator(id: str):
    if id not in map:
        data = json.dumps({
            "lat": -1,
            "lng": -1
        })
        yield f"event: locationUpdate\ndata: {data}\n\n"
    waypoints = open('waypoints.json')
    waypoints = json.load(waypoints)
    for waypoint in waypoints:
        data = json.dumps(waypoint)
        yield f"event: locationUpdate\ndata: {data}\n\n"
        await sleep(1)
    exit_data = {
        "lat": -1,
        "lng": -1
    }
    yield f"event: locationUpdate\ndata: {json.dumps(exit_data)}\n\n"

async def token_generator(id: str):
    if id not in map:
        data = json.dumps({
            "status": "error",
            "token": None
        })
        yield f"event: tokenStream\ndata: {data}\n\n"
    tokens = str(map[id]).split(' ')
    for token in tokens:
        data = json.dumps({
            "status": "in-progress",
            "token": token
        })
        yield f"event: tokenStream\ndata: {data}\n\n"
        print(token)
        await sleep(1)
    data = json.dumps({
        "status": "completed",
        "token": None
    })
    del map[id]
    yield f"event: tokenStream\ndata: {data}\n\n"



@app.post('/initiate-response')
async def initiate(request_data: dict):
    input_text = request_data.get('query')
    unique_id = str(uuid.uuid4())  # Replace with actual logic
    map[unique_id] = input_text
    response = {
        "id": unique_id,
        "response": input_text
    }
    return Response(json.dumps(response))

@app.get('/get-waypoints/{id}')
async def getwaypoints(id:str):
    return StreamingResponse(waypoints_generator(id), media_type="text/event-stream")

@app.get('/get-response/{id}')
async def getresponse(id:str):
    return StreamingResponse(token_generator(id), media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)