/*
Main goal here is to define types for this equation:
G_out = coreGrapeRankCalculator(G_in, R, P)

G_out:ScorecardsWithMetaDataV3
G_in:ScorecardsV3
R:Ratings
P:GrapeRankParameters

Or maybe use ScorecardsV3 for G_in, but ScorecardsWithMetaDataV3 wrappers (which include metadata) for G_out?
*/

type context = string
type pubkey = string
type score = number // can refer to a rating as a primary data point or to an average of ratings, so may be referred to as rating, average, or averageScore. min, max depend on the use case (0-1 for notSpam; 0-5 for 5stars or products; may be negative in some use cases). 
type input = number // nonzero, no upper bound
type confidence = number // [0, 1]; can be de novo (rating) or calculated from input (scorecard)
type influence = number // score * confidence; useful if observee can play the role of a rater or observer at a future step; may be defined differently for other use cases (e.g. 5 star ratings)
type weights = number // sum of weights; used as running score during calculations
type products = number // sum of products

type scoreAndConfidence = [score, confidence]
type scoreAndInput = [score, input]
type fullHouse = [influence, score, confidence, input]
// type expanded = [influence, score, confidence, input, weights, products]
type oExpanded = { influence: influence, score: score, confidence: confidence, input: input, weights: weights, products: products }

type rater = pubkey
type ratee = pubkey
type observer = pubkey
type observee = pubkey

// R: Ratings

type RateeObject = {
    [key: ratee]: scoreAndConfidence
  }
type RaterObject = {
    [key: rater]: RateeObject
}
export type Ratings = {
    [key: context]: RaterObject
}

export const testRatings:Ratings = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// G: Scorecards 
/*
Multiple versions, depending on which numbers are reported
ScorecardsV0 "scoreAndConfidence" -- 
ScorecardsV1 "scoreAndInput" -- alternate to V0
ScorecardsV2 "fullHouse" -- includes all 4 numbers which is better for running calculations but maybe bad for long term storage
ScorecardsV3 "oExpanded" -- bigger footprint but easier to write code

Comparisons:
V0 versus V1: input is cleaner but confidence is easier to use (since influence = score * confidence)

long term storage: 
- V0 is a good choice; in a wrapper that may include rigor as metaData which tells us how confidence was calculated
    Why? bc it reduces filesize compared to others
- VC0 idea for further data compaction: encode pubkeys with id numbers in metaData; then replace pubkeys with id numbers

running calculation using the core grapeRankCalculator:
- V3 is probably what should be used internally and returned
    Why? easiest way to write code without getting parameters mixed up
- V0, V1, V2, V3, or any other reasonable formats should be acceptable as input into the calculator
    type should be ascertained and should be converted to V3 at the start

functions written to convert from one type to another
*/

// Scorecards Version 0: scoreAndConfidence (SAME AS RATINGS TABLE)
type ObserveeObjectV0 = {
    [key: observee]: scoreAndConfidence
}
type ObserverObjectV0 = {
    [key: observer]: ObserveeObjectV0
}
export type ScorecardsV0 = {
    [key: context]: ObserverObjectV0
}

// RatingsOrScorecardsJointObject
// Since Ratings and ScorecardsV0 should be interchangeable, define one that can be either-or
type EeObject = {
    [key: ratee | observee]: scoreAndConfidence
  }
type ErObject = {
    [key: rater | observer]: EeObject
}
export type RatingsOrScorecardsJointObject = {
    [key: context]: ErObject
}



export const testScorecardsV0:ScorecardsV0 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// Scorecards Version 1: scoreAndInput
type ObserveeObjectV1 = {
    [key: pubkey]: scoreAndInput
  }
type ObserverObjectV1 = {
    [key: pubkey]: ObserveeObjectV1
}
export type ScorecardsV1 = {
    [key: context]: ObserverObjectV1
}
export const testScorecardsV1:ScorecardsV1 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// Scorecards Version 2: fullHouse
type ObserveeObjectV2 = {
    [key: pubkey]: fullHouse
  }
type ObserverObjectV2 = {
    [key: pubkey]: ObserveeObjectV2
}
export type ScorecardsV2 = {
    [key: context]: ObserverObjectV2
}
export const testScorecardsV2:ScorecardsV2 = {
    notSpam: {
        alice: {
            bob: [0.5, 1.0, 0.5, 0.05],
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1]
        },
        bob: {
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1] 
        },
        zed: {
            zed: [0.5, 1.0, 0.5, 0.05]
        }
    }
}

// Scorecards Version 3: oExpanded
type ObserveeObjectV3 = {
    [key: observee]: oExpanded
  }
type ObserverObjectV3 = {
    [key: observer]: ObserveeObjectV3
}
export type ScorecardsV3 = {
    [key: context]: ObserverObjectV3
}
export const testScorecardsV3:ScorecardsV3 = {
    notSpam: {
        alice: {
            bob: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        },
        bob: {
            charlie: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        }
    }
}

// Scorecards and Ratings Wrappers

export type ScorecardsMetaData = {
    observer: observer, // the "owner" of the scorecardTable
    grapeRankProtocolUID?: string,
    rigor?: number
}

type RatingsMetaData = {
    observer: observer // the "owner" of the Ratings (i.e. the person who commissioned its creation?)
    interpretationPrococolUID?: string
}

export type ScorecardsWithMetaDataV3 = {
    metaData: ScorecardsMetaData
    data: ScorecardsV3
}

export type RatingsWrapper = {
    metaData: RatingsMetaData
    data: Ratings
}

// GrapeRank protocol parameters
export type GrapeRankParameters = {
    seedUsers: pubkey[],
    rigor: number,
    attenuation: number,
    defaults: {
        score: number,
        confidence: number
    }
}
export const defaultGrapeRankNotSpamParameters:GrapeRankParameters = {
    seedUsers: [],
    rigor: 0.25,
    attenuation: 0.8,
    defaults: {
        score: 0,
        confidence: 0.1
    }
}

// interpretation protocol parameters
type FollowsParameters = {
    score: number,
    confidence: number
}
type MutesParameters = {
    score: number,
    confidence: number
}
type ReportsParameters = {
    score: number,
    confidence: number,
    reportTypes: string[]
}
export interface InterpProtocolParams_follows {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters
}
export interface InterpProtocolParams_mutes {
    context: string,
    pubkeys: string[],
    depth: number,
    mutes: MutesParameters
}
export interface InterpProtocolParams_reports {
    context: string,
    pubkeys: string[],
    depth: number,
    reports: ReportsParameters
}
export interface InterpProtocolParams_followsAndMutes {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters,
    mutes: MutesParameters
}