import React, { useMemo, useState } from 'react';
import { TurnHistoryRecord, Tribe } from '../types';
import Card from './ui/Card';
import { TRIBE_ICONS } from '../constants';

interface TribeGrowthChartProps {
    history: TurnHistoryRecord[];
    tribes: Tribe[];
}

const TERRITORY_COLORS = ['#4299E1', '#F56565', '#48BB78', '#ED8936', '#9F7AEA', '#ECC94B', '#38B2AC', '#ED64A6', '#A0AEC0', '#667EEA', '#F687B3', '#D69E2E', '#319795', '#6B46C1', '#C53030', '#059669'];

const TribeGrowthChart: React.FC<TribeGrowthChartProps> = ({ history, tribes }) => {
    const [hoveredTribeId, setHoveredTribeId] = useState<string | null>(null);

    const tribeColorMap = useMemo(() => {
        const map = new Map<string, string>();
        tribes.forEach((tribe, index) => {
            map.set(tribe.id, TERRITORY_COLORS[index % TERRITORY_COLORS.length]);
        });
        return map;
    }, [tribes]);

    const { chartData, maxScore, turnDomain } = useMemo(() => {
        if (history.length < 1) {
            return { chartData: [], maxScore: 0, turnDomain: [1, 1] };
        }

        const dataByTribe: { [key: string]: { turn: number, score: number }[] } = {};
        let maxS = 0;

        history.forEach(turnRecord => {
            turnRecord.tribeRecords.forEach(tribeRecord => {
                if (!dataByTribe[tribeRecord.tribeId]) {
                    dataByTribe[tribeRecord.tribeId] = [];
                }
                dataByTribe[tribeRecord.tribeId].push({ turn: turnRecord.turn, score: tribeRecord.score });
                if (tribeRecord.score > maxS) {
                    maxS = tribeRecord.score;
                }
            });
        });
        
        const firstTurn = history[0]?.turn || 1;
        const lastTurn = history[history.length - 1]?.turn || 1;

        return {
            chartData: Object.entries(dataByTribe),
            maxScore: maxS > 0 ? maxS * 1.1 : 100, // Give some headroom, avoid dividing by zero
            turnDomain: [firstTurn, lastTurn]
        };
    }, [history]);
    
    if (history.length < 2) {
        return (
            <Card title="Tribe Growth (by Score)">
                <div className="h-96 flex items-center justify-center">
                    <p className="text-slate-400 italic">Not enough turn data to display growth chart. Check back after the next turn is processed.</p>
                </div>
            </Card>
        );
    }
    
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 800; // Fixed width for SVG coordinate system
    const height = 400; // Fixed height

    const xScale = (turn: number) => {
        if (turnDomain[1] - turnDomain[0] === 0) return margin.left;
        return margin.left + (turn - turnDomain[0]) / (turnDomain[1] - turnDomain[0]) * (width - margin.left - margin.right);
    };

    const yScale = (score: number) => {
        return height - margin.bottom - (score / maxScore) * (height - margin.top - margin.bottom);
    };
    
    const yAxisTicks = useMemo(() => {
        const ticks = [];
        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
            ticks.push(Math.round((maxScore / tickCount) * i));
        }
        return ticks;
    }, [maxScore]);

    return (
        <Card title="Tribe Growth (by Score)">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow relative h-96">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        {/* Y Axis */}
                        <g className="text-xs text-slate-400">
                            {yAxisTicks.map(tick => (
                                <g key={`y-tick-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                                    <line x1={margin.left} x2={width - margin.right} stroke="#475569" strokeWidth="0.5" strokeDasharray="2,3" />
                                    <text x={margin.left - 8} y="3" textAnchor="end" fill="currentColor">{tick}</text>
                                </g>
                            ))}
                            <text transform={`translate(${margin.left / 3}, ${height/2}) rotate(-90)`} textAnchor="middle" fill="currentColor" className="font-semibold">Score</text>
                        </g>

                        {/* X Axis */}
                        <g className="text-xs text-slate-400">
                           {history.map(({ turn }) => (
                                <g key={`x-tick-${turn}`} transform={`translate(${xScale(turn)}, 0)`}>
                                     <line y1={margin.top} y2={height - margin.bottom} stroke="#475569" strokeWidth="0.5" strokeDasharray="2,3"/>
                                     <text x="0" y={height - margin.bottom + 15} textAnchor="middle" fill="currentColor">{`T${turn}`}</text>
                                </g>
                           ))}
                           <text x={width/2} y={height - 5} textAnchor="middle" fill="currentColor" className="font-semibold">Turn</text>
                        </g>

                        {/* Data Lines */}
                        <g>
                            {chartData.map(([tribeId, data]) => {
                                if (data.length < 2) return null;
                                const pathData = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.turn)},${yScale(p.score)}`).join(' ');
                                const isHovered = hoveredTribeId === tribeId;
                                return (
                                    <path
                                        key={tribeId}
                                        d={pathData}
                                        fill="none"
                                        stroke={tribeColorMap.get(tribeId) || '#A0AEC0'}
                                        strokeWidth={isHovered ? 4 : 2}
                                        className="transition-all duration-200"
                                        opacity={hoveredTribeId === null || isHovered ? 1 : 0.3}
                                    />
                                );
                            })}
                        </g>
                    </svg>
                </div>
                <aside className="lg:w-56 flex-shrink-0">
                    <h4 className="font-bold text-slate-300 mb-2">Tribes</h4>
                    <ul className="space-y-1 max-h-96 overflow-y-auto">
                        {tribes.map(tribe => (
                            <li
                                key={tribe.id}
                                onMouseEnter={() => setHoveredTribeId(tribe.id)}
                                onMouseLeave={() => setHoveredTribeId(null)}
                                className="flex items-center space-x-2 p-1.5 rounded-md cursor-pointer hover:bg-slate-700/50"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tribeColorMap.get(tribe.id) }}></div>
                                <span className="text-sm text-slate-300">{tribe.tribeName}</span>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </Card>
    );
};

export default TribeGrowthChart;
