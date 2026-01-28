
import React from 'react';
import { Scissors, Palette, Type as TextIcon, Music, Sparkles, MousePointer2 } from 'lucide-react';
import { EditTool } from '../../types';

interface ToolbarProps {
  activeTool: EditTool;
  onSelectTool: (tool: EditTool) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool }) => {
  const tools = [
    { id: EditTool.SELECT, icon: MousePointer2, label: 'Select' },
    { id: EditTool.TRIM, icon: Scissors, label: 'Trim' },
    { id: EditTool.FILTER, icon: Palette, label: 'Filters' },
    { id: EditTool.TEXT, icon: TextIcon, label: 'Text' },
    { id: EditTool.AUDIO, icon: Music, label: 'Audio' },
    { id: EditTool.AI, icon: Sparkles, label: 'AI Flow', accent: true },
  ];

  return (
    <div className="w-16 bg-[#1F2937] border-r border-gray-800 flex flex-col items-center py-4 space-y-6">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          className={`p-3 rounded-lg transition-all relative group ${
            activeTool === tool.id 
              ? 'bg-[#6366F1] text-white shadow-lg' 
              : tool.accent ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-gray-400 hover:bg-gray-700'
          }`}
          title={tool.label}
        >
          <tool.icon size={22} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
            {tool.label}
          </span>
          {activeTool === tool.id && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981] rounded-r" />
          )}
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
