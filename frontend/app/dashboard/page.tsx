// app/dashboard/page.tsx - REFORGED

'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import Container from "@/components/Container";
import TaskCard from "@/components/TaskCard";
import Button from "@/components/Button";
import CreateTaskModal from "@/components/CreateTaskModal";
import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";
import { ITask, ITasksApiResponse } from "@/types";
import UpdateTaskModal from "@/components/UpdateTaskModal";
import DeleteTaskModal from "@/components/DeleteTaskModal";
import ViewActivityModal from "@/components/ViewActivityModal";

// A small component for thematic headers
const PanelHeader = ({ title }: { title: string }) => (
  <div className="text-center mb-6">
    <h2 className="text-2xl uppercase tracking-[0.4em] text-parchment/80 text-shadow-md">
      {title}
    </h2>
    <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-paleblood-sky/30 to-transparent mx-auto mt-3"></div>
  </div>
);

export default function DashboardPage() {
  const { isAuthenticated, accessToken } = useAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null);

  const { data, error, isLoading, mutate } = useSWR<ITasksApiResponse>(
    accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks`, accessToken] : null,
    fetcher
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // --- THEMATIC LOADING AND ERROR STATES ---
  const renderOverlayContent = (text: string, colorClass: string = "text-paleblood-sky") => (
    <Container className="flex items-center justify-center h-[50vh]">
      <p className={`font-serif text-2xl text-center animate-pulse ${colorClass} text-shadow-lg`}>{text}</p>
    </Container>
  );

  if (!isAuthenticated) return renderOverlayContent("Awaiting Hunter's Mark...");
  if (isLoading) return renderOverlayContent("Communing with the Great Ones...");
  if (error) return renderOverlayContent(`Insight reveals a nightmare: ${error.message}`, "text-blood-echo");
  if (!data) return renderOverlayContent("The dream is empty. No echoes found.");

  const handleStartEdit = (task: ITask) => setTaskToEdit(task);
  const handleStartDelete = (task: ITask) => setTaskToDelete(task);

  return (
    <Container>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif uppercase tracking-[0.2em] text-parchment text-shadow-lg">The Hunt</h1>
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-12">

        {/* Left Panel: Tasks */}
        <div className="bg-yharnam-stone/20 p-6 border border-paleblood-sky/10 bg-[url('/grunge-texture.jpg')] bg-blend-soft-light">
          <PanelHeader title="Contracts" />
          <div className="space-y-4">
            {data.tasks.map((task: ITask) => (
              <TaskCard
                key={task._id}
                task={task}
                onEditClick={() => handleStartEdit(task)}
                onDeleteClick={() => handleStartDelete(task)}
              />
            ))}
          </div>
          {data.tasks.length === 0 && (
            <p className="text-center text-parchment/50 italic py-10">
              No contracts available. The night is quiet.
            </p>
          )}
        </div>

        {/* Right Panel: Actions & Activity */}
        <div className="space-y-8">
          <div className="bg-yharnam-stone/20 p-6 border border-paleblood-sky/10 bg-[url('/grunge-texture.jpg')] bg-blend-soft-light">
            <PanelHeader title="Actions" />
            <div className="space-y-4">
              <Button onClick={() => setIsCreateModalOpen(true)}>Forge Contract</Button>
              <Button onClick={() => setIsActivityModalOpen(true)}>Recall Echoes</Button>
            </div>
          </div>
          {/* Note: The recent activity list has been removed as it was static. 
                        The "View recent activity" button now opens the real, dynamic activity log. */}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} mutate={mutate} />}
      {isActivityModalOpen && <ViewActivityModal onClose={() => setIsActivityModalOpen(false)} />}
      {taskToEdit && <UpdateTaskModal task={taskToEdit} onClose={() => setTaskToEdit(null)} mutate={mutate} />}
      {taskToDelete && <DeleteTaskModal task={taskToDelete} onClose={() => setTaskToDelete(null)} mutate={mutate} />}
    </Container>
  );
}