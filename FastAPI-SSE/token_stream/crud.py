from sqlalchemy.orm import Session

from . import models, schemas

def get_request(db: Session, req_id: int):
    return db.query(models.Request).filter(models.Request.id == req_id).first()

def get_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Request).offset(skip).limit(limit).all()

def create_request(db: Session, request: schemas.RequestCreate):
    db_request = models.Request(**request.model_dump())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def delete_request(db: Session, req_id: int):
    db_request = db.query(models.Request).filter(models.Request.id == req_id).first()
    if db_request:
        db.delete(db_request)
        db.commit()
    return db_request