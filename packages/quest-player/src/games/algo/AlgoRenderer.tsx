import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlgoConfig, GameState } from "../../types";
import "./AlgoRenderer.css";

export const AlgoRenderer: React.FC<{
    gameState: GameState;
    gameConfig: AlgoConfig;
}> = ({ gameConfig }) => {
    const {
        description,
        inputFormat,
        outputFormat,
        constraints,
        sampleCases,
    } = gameConfig;

    return (
        <div className="algo-renderer">
            <div className="algo-problem-statement">
                <section className="algo-section">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                </section>

                {inputFormat && (
                    <section className="algo-section">
                        <h3>Dữ liệu vào (Input)</h3>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{inputFormat}</ReactMarkdown>
                    </section>
                )}

                {outputFormat && (
                    <section className="algo-section">
                        <h3>Dữ liệu ra (Output)</h3>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{outputFormat}</ReactMarkdown>
                    </section>
                )}

                {constraints && (
                    <section className="algo-section">
                        <h3>Ràng buộc (Constraints)</h3>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{constraints}</ReactMarkdown>
                    </section>
                )}

                {sampleCases && sampleCases.length > 0 && (
                    <section className="algo-section">
                        <h3>Ví dụ (Examples)</h3>
                        <div className="algo-examples">
                            {sampleCases.map((tc, index) => (
                                <div key={index} className="algo-example-item">
                                    <div className="algo-example-header">
                                        {tc.label || `Ví dụ ${index + 1}`}
                                    </div>
                                    <div className="algo-example-grid">
                                        <div className="algo-example-column">
                                            <span className="algo-label">Input</span>
                                            <pre className="algo-code-block">{tc.input}</pre>
                                        </div>
                                        <div className="algo-example-column">
                                            <span className="algo-label">Output</span>
                                            <pre className="algo-code-block">{tc.expectedOutput}</pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
