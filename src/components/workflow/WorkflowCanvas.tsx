import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Connection, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNode } from './NodeTypes';
import { useMemo } from 'react';

const nodeTypes = {
    workflowNode: WorkflowNode,
};

interface WorkflowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: any;
    onEdgesChange: any;
    onConnect: (params: Connection) => void;
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
}

export const WorkflowCanvas = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
}: WorkflowCanvasProps) => {
    const defaultEdgeOptions = useMemo(() => ({
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        type: 'smoothstep',
        animated: true,
    }), []);

    return (
        <div className="h-full w-full bg-slate-950 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                <Controls
                    className="!bg-slate-900/60 !border-white/10 !rounded-xl !overflow-hidden !backdrop-blur-md !shadow-2xl"
                    style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                    }}
                />
                <MiniMap
                    zoomable
                    pannable
                    className="!bg-slate-900/50 !border-white/5 !rounded-2xl !backdrop-blur-xl"
                    maskColor="rgba(2, 6, 23, 0.7)"
                    nodeColor="#334155"
                    nodeStrokeColor="#475569"
                    nodeBorderRadius={8}
                />
            </ReactFlow>
        </div>
    );
};
