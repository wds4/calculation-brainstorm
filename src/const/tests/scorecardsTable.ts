export const sampleScorecardsTable = {
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