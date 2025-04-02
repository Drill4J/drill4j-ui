/**
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Typography } from "antd"

const CoverageTreemap = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    
    const buildId = searchParams.get("buildId");

    useEffect(() => {
        if (!buildId) {
            setError("Missing a required parameter: buildId");
            setData([]);
            return;
        }

        setError("");
        const url = `/metrics/coverage-treemap?buildId=${buildId}`;
        
        axios.get(url)
            .then(response => {
                const jsonData = response.data.data;
                if (!Array.isArray(jsonData)) throw new Error("Invalid data format");

                const labels = jsonData.map(item => item.full_name);
                const parents = jsonData.map(item => item.parent || "");
                const values = jsonData.map(item => item.probes_count);
                const colors = jsonData.map(item => item.covered_probes / item.probes_count);

                setData([{
                    type: "treemap",
                    labels,
                    parents,
                    values,
                    marker: {
                        colors,
                        colorscale: [
                            [0.00, "#FF7F7F"],
                            [0.50, "#FFEEB2"],
                            [1.00, "#B2E2C2"]
                        ],
                        cmin: 0,
                        cmax: 1,
                        colorbar: {
                            tickvals: [0, 0.25, 0.5, 0.75, 1],
                            ticktext: ["0%", "25%", "50%", "75%", "100%"],
                            orientation: 'h', // Make colorbar horizontal
                            x: 0.5, // Center it horizontally
                            y: 0, // Move it below the plot
                            xanchor: 'center',
                            yanchor: 'top',
                            thickness: 5,
                            tickfont: { size: 10 },
                            len: 0.98
                        }
                    },
                    textinfo: "label+value+percent parent",
                    hoverinfo: "label+value+percent parent+percent entry",
                    branchvalues: "total"
                }]);
            })
            .catch(error => {
                setError(`Failed to load data: ${error.message}`);
            });
    }, [buildId]);

    return (
        <div>
            {error ? (
                <Typography.Text>{error}</Typography.Text>
            ) : (
                <Plot 
                    data={data} 
                    layout={{
                        margin: { l: 0, r: 0, t: 0, b: 0 },
                        autosize: true,
                        showlegend: false,
                    }}
                    config={{
                        displayModeBar: false,
                    }}
                    useResizeHandler={true}
                    style={{width: "100%", height: "100%"}}
                />
            )}
        </div>
    );
};

export default CoverageTreemap;