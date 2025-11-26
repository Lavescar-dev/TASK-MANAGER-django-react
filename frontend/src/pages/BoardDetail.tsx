import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import api from '../services/api';

// --- TİPLER ---
interface UserLite {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    order: number;
    tags: Tag[];
    due_date: string | null;
    created_at: string;                // YENİ: Oluşturulma zamanı
    assigned_to: number | null;        // ID
    assigned_to_user: UserLite | null; // Detay
    created_by_user: UserLite | null;  // YENİ: Oluşturan kişi detayı
}

interface Column {
    id: number;
    title: string;
    tasks: Task[];
}

interface BoardDetail {
    id: number;
    name: string;
    columns: Column[];
}

interface DeletedTaskData {
    columnId: number;
    taskData: {
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        tagIds: number[];
        due_date: string | null;
        assigned_to: number | null;
    };
}

// Renk Haritası
const getColorClass = (colorName: string) => {
    const colors: Record<string, string> = {
        red: 'bg-red-500 text-white',
        blue: 'bg-blue-500 text-white',
        green: 'bg-green-500 text-white',
        purple: 'bg-purple-500 text-white',
        orange: 'bg-orange-500 text-white',
        yellow: 'bg-yellow-500 text-black',
        gray: 'bg-gray-500 text-white',
    };
    return colors[colorName] || 'bg-gray-500 text-white';
};

// Tarih Formatlayıcı
const getDateStatus = (dateString: string | null) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const parts = dateString.split('-'); 
    const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;

    if (diffDays < 0) return { color: 'text-red-400', label: `Gecikti (${formattedDate})` };
    if (diffDays === 0) return { color: 'text-orange-400', label: 'Bugün' };
    if (diffDays === 1) return { color: 'text-yellow-400', label: 'Yarın' };
    return { color: 'text-gray-400', label: formattedDate };
};

// İsimden Baş Harf (Avatar)
const getInitials = (user: UserLite) => {
    const first = user.first_name ? user.first_name[0] : user.username[0];
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase();
};

// İsim Formatlayıcı (Ali Veli veya @aliveli)
const getUserName = (user: UserLite) => {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.username;
};

const BoardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [allUsers, setAllUsers] = useState<UserLite[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isColModalOpen, setIsColModalOpen] = useState(false);
    const [newColTitle, setNewColTitle] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    
    // Add Task Inputs
    const [activeColId, setActiveColId] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low'|'medium'|'high'>('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState<number | ''>('');

    // Edit Task State
    const [editingTask, setEditingTask] = useState<{colId: number, task: Task} | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPriority, setEditPriority] = useState<'low'|'medium'|'high'>('medium');
    const [editDueDate, setEditDueDate] = useState('');
    const [editSelectedTagIds, setEditSelectedTagIds] = useState<number[]>([]);
    const [editAssignee, setEditAssignee] = useState<number | ''>('');

    // Delete & Undo
    const [taskToDelete, setTaskToDelete] = useState<{colId: number, taskId: number} | null>(null);
    const [lastDeletedTask, setLastDeletedTask] = useState<DeletedTaskData | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    
    const isRestoringRef = useRef(false);

    useEffect(() => {
        fetchBoardData();
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return; 
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (!isRestoringRef.current && lastDeletedTask && showUndoToast && !editingTask) {
                    e.preventDefault();
                    handleUndoDelete();
                }
            }
            if (e.key === 'Escape') {
                if (editingTask) setEditingTask(null);
                if (isTaskModalOpen) setIsTaskModalOpen(false);
                if (taskToDelete) setTaskToDelete(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lastDeletedTask, showUndoToast, editingTask, isTaskModalOpen, taskToDelete]); 

    const fetchBoardData = async () => {
        try {
            const [boardRes, tagsRes, usersRes] = await Promise.all([
                api.get(`boards/${id}/`),
                api.get('tags/'),
                api.get('users/')
            ]);
            setBoard(boardRes.data);
            setAllTags(tagsRes.data);
            setAllUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        
        setBoard((prevBoard) => {
            if (!prevBoard) return null;
            const sourceColIndex = prevBoard.columns.findIndex(col => col.id.toString() === source.droppableId);
            const destColIndex = prevBoard.columns.findIndex(col => col.id.toString() === destination.droppableId);
            if (sourceColIndex === -1 || destColIndex === -1) return prevBoard;

            const newColumns = [...prevBoard.columns];
            const sourceCol = { ...newColumns[sourceColIndex] };
            const destCol = { ...newColumns[destColIndex] };
            const sourceTasks = Array.from(sourceCol.tasks);
            const [movedTask] = sourceTasks.splice(source.index, 1);

            if (sourceColIndex === destColIndex) {
                sourceTasks.splice(destination.index, 0, movedTask);
                newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
            } else {
                const destTasks = Array.from(destCol.tasks);
                destTasks.splice(destination.index, 0, movedTask);
                newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
                newColumns[destColIndex] = { ...destCol, tasks: destTasks };
            }
            return { ...prevBoard, columns: newColumns };
        });

        try {
            await api.patch(`tasks/${draggableId}/`, {
                column: parseInt(destination.droppableId),
                order: destination.index
            });
        } catch (error) {
            console.error("Move failed", error);
        }
    };

    const openEditModal = (colId: number, task: Task) => {
        setEditingTask({ colId, task });
        setEditTitle(task.title);
        setEditDesc(task.description);
        setEditPriority(task.priority);
        setEditDueDate(task.due_date || '');
        setEditSelectedTagIds(task.tags.map(t => t.id));
        setEditAssignee(task.assigned_to || '');
    };

    const toggleTagSelection = (tagId: number) => {
        setEditSelectedTagIds(prev => {
            if (prev.includes(tagId)) return prev.filter(id => id !== tagId);
            return [...prev, tagId];
        });
    };

    const handleUpdateTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editTitle.trim()) return;

        try {
            const response = await api.patch(`tasks/${editingTask.task.id}/`, {
                title: editTitle,
                description: editDesc,
                priority: editPriority,
                tag_ids: editSelectedTagIds,
                due_date: editDueDate || null,
                assigned_to: editAssignee || null
            });

            const updatedTask = response.data;

            setBoard((prev) => {
                if (!prev) return null;
                const updatedColumns = prev.columns.map(col => {
                    if (col.id === editingTask.colId) {
                        return {
                            ...col,
                            tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
                        };
                    }
                    return col;
                });
                return { ...prev, columns: updatedColumns };
            });

            setEditingTask(null);

        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update task");
        }
    };

    const initiateDelete = (e: React.MouseEvent, colId: number, taskId: number) => {
        e.stopPropagation();
        setTaskToDelete({ colId, taskId });
    };

    const confirmDelete = async () => {
        if (!taskToDelete || !board) return;
        const { colId, taskId } = taskToDelete;
        setEditingTask(null); 

        const column = board.columns.find(c => c.id === colId);
        const task = column?.tasks.find(t => t.id === taskId);
        if (task) {
            setLastDeletedTask({
                columnId: colId,
                taskData: { 
                    title: task.title, description: task.description, priority: task.priority,
                    tagIds: task.tags.map(t => t.id),
                    due_date: task.due_date,
                    assigned_to: task.assigned_to
                }
            });
            setShowUndoToast(true);
            setTimeout(() => setShowUndoToast(false), 5000);
        }

        try {
            await api.delete(`tasks/${taskId}/`);
            setBoard((prevBoard) => {
                if (!prevBoard) return null;
                const updatedColumns = prevBoard.columns.map(col => {
                    if (col.id === colId) {
                        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
                    }
                    return col;
                });
                return { ...prevBoard, columns: updatedColumns };
            });
            setTaskToDelete(null);
        } catch (error) {
            console.error("Delete failed", error);
            alert("Could not delete task.");
        }
    };

    const handleUndoDelete = async () => {
        if (!lastDeletedTask || isRestoringRef.current) return;
        isRestoringRef.current = true;
        
        const taskToRestore = lastDeletedTask;
        setLastDeletedTask(null);
        setShowUndoToast(false);

        try {
            const response = await api.post('tasks/', {
                column: taskToRestore.columnId,
                title: taskToRestore.taskData.title,
                description: taskToRestore.taskData.description,
                priority: taskToRestore.taskData.priority,
                tag_ids: taskToRestore.taskData.tagIds,
                due_date: taskToRestore.taskData.due_date,
                assigned_to: taskToRestore.taskData.assigned_to,
                order: 999
            });
            const restoredTask = response.data;

            setBoard((prevBoard) => {
                if (!prevBoard) return null;
                const updatedColumns = prevBoard.columns.map(col => {
                    if (col.id === taskToRestore.columnId) {
                        if (col.tasks.some(t => t.id === restoredTask.id)) return col;
                        return { ...col, tasks: [...col.tasks, restoredTask] };
                    }
                    return col;
                });
                return { ...prevBoard, columns: updatedColumns };
            });
        } catch (error) {
            console.error("Undo failed", error);
        } finally {
            isRestoringRef.current = false;
        }
    };

    const handleAddColumn = async (e: FormEvent) => {
        e.preventDefault();
        if (!newColTitle.trim() || !board) return;
        try {
            const response = await api.post('columns/', { board: board.id, title: newColTitle, order: board.columns.length });
            setBoard((prev) => {
                if(!prev) return null;
                return { ...prev, columns: [...prev.columns, { ...response.data, tasks: [] }] };
            });
            setNewColTitle(''); setIsColModalOpen(false);
        } catch (error) { console.error(error); }
    };

    const handleAddTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || activeColId === null) {
            alert("Please enter a title.");
            return;
        }

        try {
            const payload = { 
                column: activeColId, 
                title: newTaskTitle, 
                description: newTaskDesc, 
                priority: newTaskPriority,
                due_date: newTaskDueDate || null,
                assigned_to: newTaskAssignee || null,
                tag_ids: [] 
            };

            const response = await api.post('tasks/', payload);

            setBoard((prev) => {
                if(!prev) return null;
                const updatedColumns = prev.columns.map(col => {
                    if (col.id === activeColId) return { ...col, tasks: [...col.tasks, response.data] };
                    return col;
                });
                return { ...prev, columns: updatedColumns };
            });
            
            setIsTaskModalOpen(false);
            setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDueDate(''); setNewTaskAssignee('');

        } catch (error: any) { 
            console.error("Task eklenemedi:", error);
            if (error.response && error.response.data) alert(`Hata: ${JSON.stringify(error.response.data)}`);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    if (!board) return null;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col font-sans text-white">
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors text-sm">&larr; Back</button>
                    <h1 className="text-xl font-bold">{board.name}</h1>
                </div>
            </header>

            <DragDropContext onDragEnd={onDragEnd}>
                <main className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="h-full flex px-6 py-8 space-x-6 min-w-max">
                        {board.columns.map((column) => (
                            <Droppable key={column.id} droppableId={column.id.toString()}>
                                {(provided, snapshot) => (
                                    <div 
                                        className="w-80 flex-shrink-0 flex flex-col bg-gray-800 rounded-xl border border-gray-700 max-h-full shadow-lg transition-colors"
                                        style={{ borderColor: snapshot.isDraggingOver ? '#3b82f6' : '#374151' }}
                                    >
                                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
                                            <h3 className="font-semibold text-gray-200">{column.title}</h3>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded-full">{column.tasks.length}</span>
                                        </div>

                                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" style={{ minHeight: '100px' }}>
                                            {column.tasks.map((task, index) => {
                                                const dateStatus = getDateStatus(task.due_date);
                                                return (
                                                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => openEditModal(column.id, task)}
                                                                className={`relative bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-600 group hover:border-blue-500 cursor-pointer transition-all ${snapshot.isDragging ? 'ring-2 ring-blue-500 rotate-2 shadow-2xl z-50' : 'hover:translate-y-[-2px] hover:shadow-md'}`}
                                                                style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1 }}
                                                            >
                                                                <button onClick={(e) => initiateDelete(e, column.id, task.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all z-10">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                                </button>
                                                                
                                                                {task.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                                        {task.tags.map(tag => (
                                                                            <span key={tag.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getColorClass(tag.color)}`}>{tag.name}</span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between items-start mb-2 pr-6">
                                                                    <h4 className="text-sm font-medium text-white break-words">{task.title}</h4>
                                                                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${task.priority === 'high' ? 'bg-red-900 text-red-200 border border-red-800' : task.priority === 'medium' ? 'bg-yellow-900 text-yellow-200 border border-yellow-800' : 'bg-green-900 text-green-200 border border-green-800'}`}>{task.priority}</span>
                                                                </div>
                                                                
                                                                {task.description && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>}
                                                                
                                                                <div className="flex justify-between items-end mt-2">
                                                                    {/* Tarih */}
                                                                    {dateStatus ? (
                                                                        <div className={`flex items-center text-[11px] font-medium ${dateStatus.color}`}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                            {dateStatus.label}
                                                                        </div>
                                                                    ) : <div></div>}

                                                                    {/* Avatar (Assigned To) */}
                                                                    {task.assigned_to_user && (
                                                                        <div 
                                                                            className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold border border-gray-600 shadow-sm" 
                                                                            title={`Assigned to: ${getUserName(task.assigned_to_user)}`}
                                                                        >
                                                                            {getInitials(task.assigned_to_user)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                        </div>
                                        <div className="p-3 border-t border-gray-700">
                                            <button onClick={() => { setActiveColId(column.id); setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority('medium'); setNewTaskDueDate(''); setNewTaskAssignee(''); setIsTaskModalOpen(true); }} className="w-full py-2 flex items-center justify-center text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg border border-dashed border-gray-600 hover:border-gray-500">+ Add Task</button>
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                        <div className="w-80 flex-shrink-0">
                            {isColModalOpen ? (
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl">
                                    <form onSubmit={handleAddColumn}>
                                        <input autoFocus type="text" placeholder="Column Title" className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none mb-3" value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)} />
                                        <div className="flex space-x-2"><button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">Add</button><button type="button" onClick={() => setIsColModalOpen(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs">Cancel</button></div>
                                    </form>
                                </div>
                            ) : (
                                <button onClick={() => setIsColModalOpen(true)} className="w-full h-12 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800 border border-dashed border-gray-600 text-gray-400 hover:text-white rounded-xl">+ Add New Column</button>
                            )}
                        </div>
                    </div>
                </main>
            </DragDropContext>

            {/* CONFIRM DELETE MODAL */}
            {taskToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setTaskToDelete(null)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm p-6 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Task?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this task? You can undo this action shortly after.</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium shadow-lg shadow-red-900/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TASK MODAL */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setEditingTask(null)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-start bg-gray-800">
                            <div>
                                <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-1">Editing Task #{editingTask.task.id}</h3>
                                <h2 className="text-2xl font-bold text-white">Task Details</h2>
                            </div>
                            <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateTask} className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                                <input required type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                                        <option value="low">🟢 Low Priority</option>
                                        <option value="medium">🟡 Medium Priority</option>
                                        <option value="high">🔴 High Priority</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                                    <input 
                                        type="date" 
                                        value={editDueDate} 
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker()} 
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white appearance-none cursor-pointer" 
                                    />
                                </div>
                            </div>

                            {/* YENİ: Assign To Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                                <select 
                                    value={editAssignee} 
                                    onChange={(e) => setEditAssignee(Number(e.target.value) || '')} 
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {getUserName(user)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => {
                                        const isSelected = editSelectedTagIds.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTagSelection(tag.id)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                                                    isSelected 
                                                        ? `${getColorClass(tag.color)} border-transparent ring-2 ring-offset-2 ring-offset-gray-800 ring-white`
                                                        : 'bg-gray-900 text-gray-400 border-gray-600 hover:border-gray-400'
                                                }`}
                                            >
                                                {tag.name}
                                                {isSelected && <span className="ml-1">✓</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none leading-relaxed" placeholder="Add a more detailed description..." />
                            </div>

                            {/* YENİ: Created By Info (Footer) */}
                            <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                                <span>Created by: <span className="text-gray-300">{editingTask.task.created_by_user ? getUserName(editingTask.task.created_by_user) : 'Unknown'}</span></span>
                                <span>Created on: {new Date(editingTask.task.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 mt-4">
                                <button type="button" onClick={(e) => initiateDelete(e, editingTask.colId, editingTask.task.id)} className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center space-x-1 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    <span>Delete Task</span>
                                </button>
                                <div className="flex space-x-3">
                                    <button type="button" onClick={() => setEditingTask(null)} className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/30 transition-all hover:scale-105">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD TASK MODAL */}
            {isTaskModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" 
                    onClick={() => setIsTaskModalOpen(false)}
                >
                    <div 
                        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Add New Task</h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        
                        <form onSubmit={handleAddTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={newTaskTitle} 
                                    onChange={(e) => setNewTaskTitle(e.target.value)} 
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    autoFocus 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea 
                                    value={newTaskDesc} 
                                    onChange={(e) => setNewTaskDesc(e.target.value)} 
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                                    <select 
                                        value={newTaskPriority} 
                                        onChange={(e) => setNewTaskPriority(e.target.value as any)} 
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                                    <input 
                                        type="date" 
                                        value={newTaskDueDate} 
                                        onChange={(e) => setNewTaskDueDate(e.target.value)} 
                                        onClick={(e) => e.currentTarget.showPicker()} 
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none" 
                                    />
                                </div>
                            </div>

                            {/* YENİ: Add Task için de Assignee */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                                <select 
                                    value={newTaskAssignee} 
                                    onChange={(e) => setNewTaskAssignee(Number(e.target.value) || '')} 
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {getUserName(user)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsTaskModalOpen(false)} 
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                >
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardDetail;