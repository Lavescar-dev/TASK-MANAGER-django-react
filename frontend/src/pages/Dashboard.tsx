import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Board {
    id: number;
    name: string;
    description: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDesc, setNewBoardDesc] = useState('');

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const response = await api.get('boards/');
            setBoards(response.data);
        } catch (error: any) {
            console.error('Error fetching boards:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleCreateBoard = async (e: FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        try {
            const response = await api.post('boards/', {
                name: newBoardName,
                description: newBoardDesc || "" // Boş ise boş string gönder
            });
            
            setBoards([...boards, response.data]);
            
            setNewBoardName('');
            setNewBoardDesc('');
            setIsModalOpen(false);
            
        } catch (error: any) {
            console.error('Error creating board:', error);
            if (error.response && error.response.data) {
                alert(`Failed to create board: ${JSON.stringify(error.response.data)}`);
            } else {
                alert('Failed to create board. Please check console.');
            }
        }
    };

    // --- YENİ: PANO SİLME FONKSİYONU ---
    const handleDeleteBoard = async (e: React.MouseEvent, boardId: number) => {
        e.stopPropagation(); // Kartın içine girilmesini engelle
        
        if (!window.confirm("Are you sure you want to delete this board? All tasks inside will be lost!")) return;

        try {
            await api.delete(`boards/${boardId}/`);
            // Listeden sil
            setBoards(boards.filter(b => b.id !== boardId));
        } catch (error) {
            console.error("Error deleting board:", error);
            alert("Could not delete board.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {/* Navbar */}
            <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">📋</span>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Task<span className="text-blue-500">Manager</span>
                        </h1>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <h2 className="text-3xl font-bold text-gray-100">My Projects</h2>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95"
                    >
                        + Create New Board
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading your boards...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                                <p className="text-gray-400 text-lg mb-4">You don't have any boards yet.</p>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    Create your first board &rarr;
                                </button>
                            </div>
                        ) : (
                            boards.map((board) => (
                                <div 
                                    key={board.id} 
                                    onClick={() => navigate(`/board/${board.id}`)}
                                    className="group bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    {/* --- SİLME BUTONU --- */}
                                    <button
                                        onClick={(e) => handleDeleteBoard(e, board.id)}
                                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
                                        title="Delete Board"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {/* -------------------- */}

                                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors pr-8">{board.name}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2 h-10">{board.description || 'No description provided.'}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Create Board Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Create New Board</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateBoard} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Board Name</label>
                                <input
                                    type="text"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Website Redesign"
                                    autoFocus
                                    required // Zorunlu alan
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                                <textarea
                                    value={newBoardDesc}
                                    onChange={(e) => setNewBoardDesc(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
                                    placeholder="What is this project about?"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newBoardName.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                >
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;