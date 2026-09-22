import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Layers,
  Wrench,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Task {
  id: string;
  orderNumber: string;
  title: string;
  station: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  targetQty: number;
  completedQty: number;
  dueDate: string;
  instructions: string;
}

export function EmployeeTasksPage() {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [shiftTime, setShiftTime] = useState('04h 28m');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      orderNumber: 'WO-2026-001',
      title: 'Titanium Turbine Blade CNC Roughing',
      station: 'Milling Cell 3 (Okuma 5-Axis)',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      targetQty: 50,
      completedQty: 32,
      dueDate: 'Today, 17:00',
      instructions: 'Ensure coolant pressure is at 80 bar. Check surface finish Ra < 0.8um after every 10 parts.',
    },
    {
      id: 'task-2',
      orderNumber: 'WO-2026-003',
      title: 'Precision Hydraulic Actuator Metrology Check',
      station: 'QA CMM Room 1',
      priority: 'MEDIUM',
      status: 'PENDING',
      targetQty: 25,
      completedQty: 0,
      dueDate: 'Tomorrow, 12:00',
      instructions: 'Run calibrated Zeiss probe protocol #B-209 and save export inspection log.',
    },
    {
      id: 'task-3',
      orderNumber: 'WO-2026-004',
      title: 'Inconel 718 Bar Stock Staging & Lot Tagging',
      station: 'Depot A - Heavy Receiving',
      priority: 'LOW',
      status: 'COMPLETED',
      targetQty: 100,
      completedQty: 100,
      dueDate: 'Completed 09:30',
      instructions: 'Verify heat number certificates against supplier PO and mark pallet with RFID barcode.',
    },
  ]);

  const handleUpdateTaskStatus = (id: string, newStatus: Task['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleLogProgress = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextQty = Math.min(t.targetQty, t.completedQty + 5);
          return {
            ...t,
            completedQty: nextQty,
            status: nextQty >= t.targetQty ? 'COMPLETED' : 'IN_PROGRESS',
          };
        }
        return t;
      })
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Assigned Tasks & Work Orders
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
              Technician Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Execution terminal for {user?.firstName} {user?.lastName} ({user?.roleName?.replace(/_/g, ' ')})
          </p>
        </div>

        {/* Live Shift Widget */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-subtle">
          <div className="flex items-center gap-2 px-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">
                {isClockedIn ? 'Active Shift' : 'Clocked Out'}
              </p>
              <p className="text-xs font-bold text-slate-800">
                {isClockedIn ? `Elapsed: ${shiftTime}` : 'Shift Ended'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isClockedIn ? 'outline' : 'primary'}
            onClick={() => setIsClockedIn(!isClockedIn)}
            leftIcon={isClockedIn ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-white" />}
          >
            {isClockedIn ? 'Clock Out / Break' : 'Clock In Now'}
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-brand-500">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Assigned Orders</p>
            <p className="text-xl font-bold text-slate-800">{tasks.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">In Progress</p>
            <p className="text-xl font-bold text-slate-800">
              {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Completed Today</p>
            <p className="text-xl font-bold text-slate-800">
              {tasks.filter((t) => t.status === 'COMPLETED').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'IN_PROGRESS', 'PENDING', 'COMPLETED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === filter
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {filter.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task) => {
          const progressPercent = Math.round((task.completedQty / task.targetQty) * 100);

          return (
            <Card key={task.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {task.orderNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                    <Badge
                      variant={
                        task.status === 'COMPLETED'
                          ? 'success'
                          : task.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        task.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-600'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.station}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 font-sans">
                    <span className="font-semibold text-slate-700">Instructions: </span>
                    {task.instructions}
                  </p>
                </div>

                {/* Right Progress & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-72 shrink-0">
                  <div className="w-full sm:w-36 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Output</span>
                      <span className="text-slate-800">
                        {task.completedQty} / {task.targetQty}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressPercent >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-right text-slate-400 font-mono">
                      {progressPercent}% Met
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status !== 'COMPLETED' ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleLogProgress(task.id)}
                        >
                          +5 Output
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                        >
                          Complete
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
