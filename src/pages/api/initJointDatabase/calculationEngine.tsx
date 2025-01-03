import { db } from "@vercel/postgres"
import type { NextApiRequest, NextApiResponse } from 'next'

/*
usage:
http://localhost:3000/api/initJointDatabase/calculationEngine
https://calculation-brainstorm.vercel.app/api/initJointDatabase/calculationEngine
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
DROP TABLE IF EXISTS rawDataSourceCategories;
DROP TABLE IF EXISTS rawDataSources;
DROP TABLE IF EXISTS interpretationEngines;
DROP TABLE IF EXISTS interpretationProtocols_calculationEngine;
DROP TABLE IF EXISTS grapeRankProtocols;
DROP TABLE IF EXISTS protocolParameters;

CREATE TABLE scorecardsTables (
  ID SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'notSpam',
  pubkey VARCHAR(255) NOT NULL,
  customerId INT,
  scorecardsWithMetaData JSONB NOT NULL DEFAULT '{}',
  lastUpdated INT NOT NULL DEFAULT 0,
  UNIQUE (name, pubkey)
);

-- coreTable2
CREATE TABLE IF NOT EXISTS rawDataSourceCategories(
  ID SERIAL PRIMARY KEY,
  SLUG TEXT UNIQUE NOT NULL,
  NAME TEXT,
  DESCRIPTION TEXT
);

INSERT INTO rawDataSourceCategories (slug, name) VALUES ('nostr', 'nostr'); 
INSERT INTO rawDataSourceCategories (slug, name) VALUES ('Amazon', 'Amazon');
INSERT INTO rawDataSourceCategories (slug, name) VALUES ('chatGPT', 'Chat GPT');
INSERT INTO rawDataSourceCategories (slug, name) VALUES ('AI', 'AI');

-- coreTable3

-- This table maay not be needed; it may be left up to the interpretation engine to select individual data sources (eg specific relays). Alternatively, the interpretationProtocol could have 
-- the OPTION to request particular data sources.

CREATE TABLE IF NOT EXISTS rawDataSources(
  ID SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rawDataSourceCategorySlug TEXT NOT NULL -- points to coreTable2, rawDataSourceCategories.slug (alternate: rawDataSourceCategoryID INT NOT NULL, points to rawDataSourceCategories.id)
);

INSERT INTO rawDataSources (slug, name, rawDataSourceCategorySlug) VALUES ('brainstormNostrRelay', 'The Awesome Brainstorm Nostr Relay', 'nostr' );

-- coreTable4
CREATE TABLE IF NOT EXISTS interpretationEngines(
  ID SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  title TEXT,
  description TEXT,  
  aSupportedRawDataSourceCategorySlugs JSONB NOT NULL -- points to coreTable2, rawDataSourceCategories.slug (alternate: aSupportedRawDataSourceCategoryIDs INT NOT NULL, points to rawDataSourceCategories.id)
);

INSERT INTO interpretationEngines (slug, name, aSupportedRawDataSourceCategorySlugs ) VALUES ('BrainstormNostrInterpEngine', 'The Awesome Brainstorm Nostr Interpretation Engine', '{ "aSlugs": [ "nostr" ] }' );

-- coreTable5
CREATE TABLE IF NOT EXISTS interpretationProtocols_calculationEngine(
  ID SERIAL PRIMARY KEY,
  universalInterpretationProtocolID TEXT UNIQUE NOT NULL, -- used to communicate with the nostr interpretation engine; might be the same as the slug
  slug TEXT,
  name TEXT,
  description TEXT,
  rawDataSourceCategorySlug TEXT NOT NULL -- points to coreTable2, rawDataSourceCategories.slug (alternate: rawDataSourceCategoryID INT NOT NULL, points to rawDataSourceCategories.id)
);

-- universal (rawDataSourceCategorySlug is null or 'all' or 'GrapeRank')
-- DEPRECATING INSERT INTO interpretationProtocols slug, name, rawDataSourceCategorySlug ) VALUES ('grapeRank', 'GrapeRank', 'grapeRank' );

-- specific to rawDataSourceCategorySlug
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicFollowsInterpretation', 'the Standard Follows Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicMutesInterpretation', 'the Standard Mutes Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicReportsInterpretation', 'the Standard Reports Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('expandedReportsInterpretation', 'the Expanded Reports Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('standardGrapevineNetworkInterpretation', 'the Standard Grapevine Network Interpretation', 'nostr' ); -- this is a combo of follows, mutes, and reports all in one


-- INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicAmazonInterpretation', 'Amazon Product Ratings Interpretation', 'Amazon' );


-- coreTable6
CREATE TABLE IF NOT EXISTS grapeRankProtocols(
  ID SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  parametersJsonSchema JSONB, -- stringified JSON schema (json-schema.org) template for all required and optional parameters, which may be very different for each protocol. This may or may not include default values.
  parametersJsonSchemaNaddr TEXT -- naddr to an event with the JSON Schema, managed by Brainstorm. Advantage: multiple (competing) services can point to this naddr and ensure compatibility with the wider community
);

INSERT INTO grapeRankProtocols (slug, parametersJsonSchema ) VALUES ('basicGrapevineNetwork', '{ "properties": { "attenuation": { "type": "float", "min": 0, "max": 1, "default": 0.8 }, "rigor": { "type": "float", "min": 0, "max": 1, "default": 0.25 }, "defaultUserScore": { "type": "float", "min": 0, "max": 1, "default": 0.0 }, "defaultUserScoreConfidence": { "type": "float", "min": 0, "max": 1, "default": 0.01} } }' );
INSERT INTO grapeRankProtocols (slug, parametersJsonSchema ) VALUES ('basic5StarProductCalculation', '{ "properties": { "defaultProductScore": { "type": "float", "min": 0, "max": 5, "default": 0.0 }, "defaultProductScoreConfidence": { "type": "float", "min": 0, "max": 1, "default": 0.05 } }}' );

-- deprecating bc switching parametersJsonSchema from TEXT to JSONB
-- INSERT INTO grapeRankProtocols (slug, parametersJsonSchema ) VALUES ('basicGrapevineNetwork', '{ properties: { attenuation: { type: float, min: 0, max: 1, default: 0.8 }, rigor: { type: float, min: 0, max: 1, default: 0.25 }, defaultUserScore: { type: float, min: 0, max: 1, default: 0.0 }, defaultUserScoreConfidence: { type: float, min: 0, max: 1, default: 0.01} } }' );
-- INSERT INTO grapeRankProtocols (slug, parametersJsonSchema ) VALUES ('basic5StarProductCalculation', '{ properties: { defaultProductScore: { type: float, min: 0, max: 5, default: 0.0 }, defaultProductScoreConfidence: { type: float, min: 0, max: 1, default: 0.05 } }}' );

-- coreTable7
CREATE TABLE IF NOT EXISTS protocolParameters(
  ID SERIAL PRIMARY KEY,
  customerID INT NOT NULL,
  protocolCategoryTableName TEXT NOT NULL, -- 'interpretationProtocols' or 'grapeRankProtocols' or (coreTable5 or coreTable6) 
  protocolSlug TEXT NOT NULL, -- [protocolCategoryTableName].slug
  -- protocolID  INT NOT NULL, -- alternate to protocolSlug; [protocolCategoryTableName].id
  
  params JSONB NOT NULL, -- object that contains the parameters with selected values
  
  -- ALTERNATE to selectedParameters:
  parametersNaddr TEXT, -- naddr to an event with the JSON Schema, managed by Brainstorm. Advantage: multiple (competing) services can point to this naddr and ensure compatibility with the wider community

  -- OPTIONAL, if we want to give the user the ability to save multiple parameter settings
  name TEXT
);

-- defaults
INSERT INTO protocolParameters (customerID, protocolCategoryTableName, protocolSlug, params ) VALUES (1, 'interpretationProtocols', 'basicFollowsInterpretation', '{ "score": 1, "confidence": 0.05 }' );
INSERT INTO protocolParameters (customerID, protocolCategoryTableName, protocolSlug, params ) VALUES (1, 'interpretationProtocols', 'basicMutesInterpretation', '{ "score": 0, "confidence": 0.10 }' );
INSERT INTO protocolParameters (customerID, protocolCategoryTableName, protocolSlug, params ) VALUES (1, 'interpretationProtocols', 'basicReportsInterpretation', '{ "score": 0, "confidence": 0.20 }' );
INSERT INTO protocolParameters (customerID, protocolCategoryTableName, protocolSlug, params ) VALUES (1, 'interpretationProtocols', 'expandedReportsInterpretation', '{ "reportTypesGroupA": { "reportTypes": [ "malware", "illegal", "spam", "impersonation" ], "score": 1, "confidence": 0.5 }, "reportTypesGroupB": { "reportTypes": [ "profanity", "nudity" ], "score": 1, "confidence": 0.02 }, "reportTypesGroupC": { "reportTypes": [ "other" ], "score": 1, "confidence": 0.1 } }' );
INSERT INTO protocolParameters (customerID, protocolCategoryTableName, protocolSlug, params ) VALUES (1, 'grapeRankProtocols', 'basicGrapevineNetwork', '{ "observer": "self", "context": "notSpam", "seedUsers": [ "self" ], "attenuation": 0.8, "rigor": 0.25, "defaults": { "score": 0, "confidence": 0.01 } }' );

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
