from fastapi import FastAPI, Response, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from asyncio import sleep
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine

import json, uvicorn, uuid

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WAYPOINT STREAM ENDPOINT (TEST)------------------------------------------------------------

async def waypoints_generator():
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

@app.get('/get-waypoints')
async def getwaypoints():
    return StreamingResponse(waypoints_generator(), media_type="text/event-stream")

# TOKEN STREAM ENDPOINTS with MAP ------------------------------------------------------------

map = {}

async def map_token_generator(id: str):
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

@app.post('/map-initiate-response')
async def map_initiate(request_data: dict):
    input_text = request_data.get('query')
    unique_id = str(uuid.uuid4())  # Replace with actual logic
    map[unique_id] = input_text
    response = {
        "id": unique_id,
        "response": input_text
    }
    return Response(json.dumps(response))


@app.get('/map-stream-response/{id}')
async def getresponse(id:str):
    return StreamingResponse(map_token_generator(id), media_type="text/event-stream")



# TOKEN STREAM ENDPOINTS with POSTGRESQL ------------------------------------------------------------

async def psql_token_generator(id: int, db: Session):
    db_req = crud.get_request(db, req_id=id)
    if db_req is None:
        data = json.dumps({
            "status": "error",
            "token": None
        })
        yield f"event: tokenStream\ndata: {data}\n\n"

    tokens = db_req.query.split(' ')

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
    crud.delete_request(db=db, req_id=id)
    yield f"event: tokenStream\ndata: {data}\n\n"

@app.post("/initiate-response/", response_model=schemas.Request)
def initiate_response(req: schemas.RequestCreate, db: Session = Depends(get_db)):
    try:
        created_request = crud.create_request(db=db, request=req)
        return created_request
    except Exception as err:
        raise HTTPException(status_code=404, detail=err) 
    

@app.get('/stream-response/{id}')
async def stream_response(id: int, db: Session = Depends(get_db)):
    return StreamingResponse(psql_token_generator(id, db), media_type="text/event-stream")


# TEST API ENDPOINT ------------------------------------------------------------

@app.get("/tests/", response_model=list[schemas.Request])
def get_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_requests(db=db, skip=skip, limit=limit)

@app.get("/test/{id}", response_model=schemas.Request)
def get_request(id: int, db: Session = Depends(get_db)):
    db_req = crud.get_request(db, req_id=id)
    if db_req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return db_req

@app.post("/test/", response_model=schemas.Request)
def create_request(req: schemas.RequestCreate, db: Session = Depends(get_db)):
    return crud.create_request(db=db, request=req)

@app.delete("/test/{id}", response_model=schemas.Request)
def delete_request(id: int, db: Session = Depends(get_db)):
    return crud.delete_request(db=db, req_id=id)

# ROOT API ENDPOINT ------------------------------------------------------------

@app.get('/')
async def root():
    return {'hello': 'world'}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)