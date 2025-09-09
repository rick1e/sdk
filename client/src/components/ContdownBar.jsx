import React, { useEffect, useState } from "react";

const CountdownBar = ({ duration = 100 }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        let current = 100;
        const interval = setInterval(() => {
            current -= 100 / duration;
            if (current <= 0) {
                current = 0;
                clearInterval(interval);
            }
            setProgress(current);
        }, 1000);

        return () => clearInterval(interval);
    }, [duration]);

    return (
        <div
            style={{
                width: "80%",
                height: "40px",
                background: "#333",
                borderRadius: "8px",
                overflow: "hidden",
                margin: "20px auto"
            }}
        >
            <div
                style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: progress > 0 ? "limegreen" : "red",
                    transition: "width 1s linear"
                }}
            />
        </div>
    );
};

export default CountdownBar;
