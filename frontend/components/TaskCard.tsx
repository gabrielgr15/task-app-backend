// components/TaskCard.tsx - REFORGED

import { ITask } from "@/types";

interface TaskCardProps {
  task: ITask;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export default function TaskCard({ task, onEditClick, onDeleteClick }: TaskCardProps) {
  return (
    <div className="bg-black/20 p-4 border border-paleblood-sky/10 flex justify-between items-center transition-all duration-300 hover:bg-yharnam-stone/40 hover:border-paleblood-sky/30">
      <div className="flex-grow">
        <h3 className="font-bold font-serif text-lg text-parchment">{task.title}</h3>
        {task.description && <p className="text-sm text-parchment/70 font-sans mt-1">{task.description}</p>}
        <p className="text-xs text-paleblood-sky/60 mt-2 uppercase tracking-widest">{task.status}</p>
      </div>

      <div className="flex flex-col items-center space-y-2 ml-4 flex-shrink-0">
        <button
          onClick={onEditClick}
          aria-label={`Edit task ${task.title}`}
          className="font-serif text-xs uppercase tracking-widest text-parchment/60 hover:text-paleblood-sky transition-colors duration-200"
        >
          Modify
        </button>

        <button
          onClick={onDeleteClick}
          aria-label={`Delete task ${task.title}`}
          className="font-serif text-xs uppercase tracking-widest text-parchment/60 hover:text-blood-echo transition-colors duration-200"
        >
          Discard
        </button>
      </div>
    </div>
  );
}