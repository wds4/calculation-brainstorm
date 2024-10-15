import { db } from "@vercel/postgres"
import type { NextApiRequest, NextApiResponse } from 'next'

/*
usage:
http://localhost:3000/api/initJointDatabase/interpretationEngine
https://calculation-brainstorm.vercel.app/api/initJointDatabase/interpretationEngine
*/

type ResponseData = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const client = await db.connect();
    try {
      const result = await client.sql`
DROP TABLE IF EXISTS interpretationProtocols_interpretationEngine;
DROP TABLE IF EXISTS users;

-- coreTable1
CREATE TABLE IF NOT EXISTS interpretationProtocols_interpretationEngine(
  ID SERIAL PRIMARY KEY,
  universalInterpretationProtocolID TEXT UNIQUE NOT NULL, -- used to communicate with the nostr calculation engine; might be the same as the slug
  slug TEXT, -- optional
  name TEXT, -- optional
  title TEXT, -- optional
  description TEXT,
  parametersJsonSchema JSONB, -- stringified json that describes the object that holds parameters that must be communicated across the API
  -- OPTIONAL: use naddr to point to the jsonSchema in place of the parametersJsonSchema column
  parametersJsonSchemaNaddr TEXT -- naddr that points to an event in which the json schema is stored (? stringified and placed in content; ? kind)
);

-- coreTableU
CREATE TABLE IF NOT EXISTS users (
  ID SERIAL PRIMARY KEY,
  pubkey TEXT UNIQUE NOT NULL,
  observerObject JSONB DEFAULT '{}', -- { id1: f, id2: m, ...  } - later replace follow with [1, 0.05]
  follows JSONB DEFAULT '[]' NOT NULL,
  followsCreatedAt INT DEFAULT 0,
  followers JSONB DEFAULT '[]' NOT NULL,
  mutes JSONB DEFAULT '[]' NOT NULL,
  mutesCreatedAt INT DEFAULT 0,
  mutedBy JSONB DEFAULT '[]' NOT NULL,
  lastUpdated INT DEFAULT 0,
  haveFollowsAndMutesBeenInput boolean DEFAULT false,
  whenLastQueriedFollowsAndMutes INT DEFAULT 0,
  whenLastInputFollowsAndMutesAttempt INT DEFAULT 0,
  whenLastCreatedObserverObject INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events {
  ID SERIAL PRIMARY KEY,
  kind INT NOT NULL,
  eventID VARCHAR(255) NOT NULL,
  pubkey TEXT NOT NULL,
  created_at INT NOT NULL,
  event JSONB NOT NULL
}
  `;
      console.log(result)
      res.status(200).json({ message: 'initJointDatabase:: All done!' })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'error!' })
    } finally {
      client.release();
    }
}
