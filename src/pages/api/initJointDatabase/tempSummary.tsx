import { db } from "@vercel/postgres"
import type { NextApiRequest, NextApiResponse } from 'next'

/*
usage:
http://localhost:3000/api/initJointDatabase/tempSummary
https://calculation-brainstorm.vercel.app/api/initJointDatabase/tempSummary
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
DROP TABLE IF EXISTS scorecardsTables;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ratingsTables;
DROP TABLE IF EXISTS dosSummaries;
DROP TABLE IF EXISTS customers;

CREATE TABLE scorecardsTables (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'notSpam',
  pubkey VARCHAR(255) NOT NULL,
  customerId INT,
  scorecardsWithMetaData JSONB NOT NULL DEFAULT '{}',
  lastUpdated INT NOT NULL DEFAULT 0,
  UNIQUE (name, pubkey)
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

-- coreTableA
CREATE TABLE IF NOT EXISTS ratingsTables(
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'default',
  pubkey VARCHAR(255) NOT NULL,
  customerId INT,
  ratingsWithMetaData JSONB NOT NULL DEFAULT '{}',
  lastUpdated INT NOT NULL DEFAULT 0,
  UNIQUE (name, pubkey)
);

CREATE TABLE IF NOT EXISTS dosSummaries(
  ID SERIAL PRIMARY KEY,
  pubkey VARCHAR(255) UNIQUE NOT NULL,
  userId INT UNIQUE NOT NULL,
  customerId INT UNIQUE NOT NULL,
  dosData JSONB NOT NULL DEFAULT '{}',
  lastUpdated INT NOT NULL DEFAULT 0
);

-- coreTable1
CREATE TABLE IF NOT EXISTS customers(
  ID SERIAL PRIMARY KEY,
  pubkey VARCHAR(255) UNIQUE NOT NULL,
  userId INT UNIQUE NOT NULL DEFAULT 0,
  whenSignedUp INT NOT NULL DEFAULT 0
);

INSERT INTO customers (pubkey) VALUES ('default'); 
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
