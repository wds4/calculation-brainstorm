/*
to access:
http://localhost:3000/api
https://calculation-brainstorm.vercel.app/api
*/

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Welcome to the Calculation Engine API!' })
}