from pydantic import BaseModel


class RequestBase(BaseModel):
    query: str

class RequestCreate(RequestBase):
    pass

class Request(RequestBase):
    id: int

    class Config:
        from_attributes = True


class ResponseBase(BaseModel):
    token: str
    status: str

class ResponseCreate(ResponseBase):
    pass

class Response(ResponseBase):

    class Config:
        from_attributes = True