import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    const {name, message} = req.body
    if (name == undefined || message == undefined) {
      return res.status(404).json({ message: 'Name or Message cannot be empty' })
    }
    return res.status(404).json({ message: 'Hi ' + name + ', ' + message })
  } else {
    return res.status(200).json({ message: 'Hello from Next.js!' })
  }
}