import { insertDanceMove, addDanceBlock } from "../../../src/api/passthrough"
import { DAWData } from "common"

jest.mock("../../../src/audio/context", () => ({
    sampleRate: 44100,
}))

// Mock reducers to avoid importing CodeMirror / ES Module problems
jest.mock("../../../src/reducers", () => ({
    default: { dispatch: jest.fn(), getState: jest.fn() },
}))

jest.mock("../../../src/app/postRun", () => ({}))
jest.mock("../../../src/app/runner", () => ({ getLineNumber: jest.fn(() => 1) }))
jest.mock("../../../src/app/Confetti", () => ({ blastConfetti: jest.fn() }))

// Mock the esconsole to avoid actual logging during tests
jest.mock("../../../src/esconsole", () => jest.fn())


describe("passthrough dance api", () => {
    let mockResult: DAWData;

    beforeEach(() => {
        // Mock a basic DAWData result
        mockResult = {
            init: true,
            finish: false,
            length: 0,
            tracks: [],
            transformedClips: {},
        } as unknown as DAWData;
    });

    describe("insertDanceMove bounds checking", () => {
        it("should throw RangeError if l_arm_move does not exist in animations", () => {
            expect(() => {
                insertDanceMove(mockResult, "INVALID_MOVE", "R_ARM", 1, 1);
            }).toThrow(RangeError);
        });

        it("should throw RangeError if r_arm_move does not exist in animations", () => {
            expect(() => {
                insertDanceMove(mockResult, "L_ARM", "INVALID_MOVE", 1, 1);
            }).toThrow(RangeError);
        });

        it("should throw TypeError or throw generic error from checking if missing arguments", () => {
            expect(() => {
                (insertDanceMove as any)(mockResult, "L_ARM", "R_ARM");
            }).toThrow(); // Should throw error due to checkArgCount
        });

        it("should throw RangeError if measure < 1", () => {
            expect(() => {
                insertDanceMove(mockResult, "L_ARM", "R_ARM", 0, 1);
            }).toThrow(RangeError);
        });

        it("should throw RangeError if repeat < 1", () => {
            expect(() => {
                insertDanceMove(mockResult, "L_ARM", "R_ARM", 1, 0);
            }).toThrow(RangeError);
        });

        it("should not throw error for valid inputs", () => {
            expect(() => {
                insertDanceMove(mockResult, "L_ARM", "R_ARM", 1, 1);
            }).not.toThrow();
        });
    });

    describe("addDanceBlock functionality", () => {
        it("should validate and possibly add dance block without crashing", () => {
            const danceBlock = {
                l_arm_move: "L_ARM",
                r_arm_move: "R_ARM",
                measure: 2,
                repeat: 4,
            } as any;

            expect(() => {
                addDanceBlock(mockResult, danceBlock);
            }).not.toThrow();
        });
    });
});
