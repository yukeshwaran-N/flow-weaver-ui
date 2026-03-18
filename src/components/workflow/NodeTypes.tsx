import { Handle, Position } from '@xyflow/react';
import { LucideIcon, Zap, CheckSquare, Bell, Globe, Mail, Code, MessageSquare } from 'lucide-react';

interface CustomNodeProps {
    data: {
        label: string;
        type: 'task' | 'approval' | 'notification' | 'webhook' | 'smtp' | 'code' | 'trigger' | 'python';
        description?: string;
        params?: any;
    };
    selected?: boolean;
}

const nodeIcons: Record<string, LucideIcon> = {
    task: Zap,
    approval: CheckSquare,
    notification: Bell,
    webhook: Globe,
    smtp: Mail,
    code: Code,
    trigger: MessageSquare,
    python: Zap,
};

const iconColors: Record<string, string> = {
    task: 'text-blue-400',
    approval: 'text-amber-400',
    notification: 'text-green-400',
    webhook: 'text-purple-400',
    smtp: 'text-indigo-400',
    code: 'text-orange-400',
    trigger: 'text-rose-400',
    python: 'text-sky-400',
};

export const WorkflowNode = ({ data, selected }: CustomNodeProps) => {
    const nodeType = data.type || 'task';
    const Icon = nodeIcons[nodeType] || Zap;
    const colorClass = iconColors[nodeType] || iconColors.task;
    const isExecuting = (data as any).executing;



    return (
        <div className="group relative">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-500 hover:!scale-150 transition-transform !-left-1.5 z-20"
            />

            <div className={`
                relative flex flex-col items-center justify-between w-28 h-28 p-3.5 rounded-2xl border-2 transition-all duration-500
                bg-slate-900/60 backdrop-blur-2xl shadow-xl
                ${selected ? 'border-indigo-500 ring-6 ring-indigo-500/10 scale-105' : 'border-white/5 hover:border-white/10'}
                ${isExecuting ? 'animate-pulse border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}
            `}>
                {/* Status indicator badge - Balanced */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-1 py-0.5 rounded-full bg-slate-800/80 border border-white/5">
                    <div className={`w-1 h-1 rounded-full ${isExecuting ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
                </div>

                {/* Main Icon Area */}
                <div className={`flex items-center justify-center p-2 rounded-xl bg-slate-800/50 border border-white/5 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Content Block */}
                <div className="text-center w-full mt-1">
                    <h3 className={`text-[10px] font-black tracking-tight truncate leading-tight px-1 ${selected ? 'text-indigo-400' : 'text-slate-100'}`}>
                        {data.label}
                    </h3>
                </div>

                {/* Glass Glint Overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Type badge floating below - Readable version */}
            <div className={`
                absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md border border-white/10
                bg-slate-950/90 backdrop-blur-md shadow-xl transition-all duration-300
                ${selected ? 'scale-110 border-indigo-500/30' : 'opacity-80'}
            `}>
                <p className={`text-[7px] font-black uppercase tracking-[0.25em] ${colorClass}`}>
                    {nodeType}
                </p>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-500 hover:!scale-150 transition-transform !-right-1.5 z-20"
            />
        </div>
    );
};
