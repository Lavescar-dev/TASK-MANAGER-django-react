import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// --- YARDIMCI FONKSİYON: Resim URL Düzeltici ---
const getFullImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
};

interface UserProfile {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string | null;
    position: string;
}

const Profile = () => {
    const navigate = useNavigate();
    
    // State
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Hata mesajı için
    
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            console.log("Profil verisi isteniyor...");
            
            const response = await api.get('profile/');
            console.log("Gelen Veri:", response.data); // Konsolda veriyi görelim
            
            const data = response.data;
            setUser(data);
            
            // Formu doldur
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setEmail(data.email || '');
            setPosition(data.position || '');
            
        } catch (err: any) {
            console.error("Profil yüklenemedi:", err);
            setError("Profil bilgileri alınamadı. Lütfen tekrar giriş yapın.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('email', email);
        formData.append('position', position);
        
        if (selectedFile) {
            formData.append('avatar', selectedFile);
        }

        try {
            await api.patch('profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Profile updated successfully!");
            navigate('/dashboard');
        } catch (err) {
            console.error("Güncelleme hatası:", err);
            alert("Profil güncellenemedi.");
        }
    };

    // --- GÜVENLİ RENDER ---
    
    // 1. Yükleniyor Durumu
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-pulse text-xl">Loading Profile...</div>
            </div>
        );
    }

    // 2. Hata Durumu (User yoksa veya hata varsa)
    if (error || !user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl text-red-400 mb-4">Hata Oluştu</h2>
                <p className="text-gray-400 mb-6">{error || "Kullanıcı bilgisi bulunamadı."}</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                >
                    Dashboard'a Dön
                </button>
            </div>
        );
    }

    // 3. Başarılı Durum (User var)
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {/* Navbar */}
            <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-md">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <button 
                        className="flex items-center space-x-2 cursor-pointer hover:text-blue-400 transition-colors text-white" 
                        onClick={() => navigate('/dashboard')}
                    >
                        <span className="text-xl">⬅</span>
                        <h1 className="text-lg font-bold">Back to Dashboard</h1>
                    </button>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Account Settings</h2>
                    <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs font-semibold tracking-wide uppercase">
                        {user.username}
                    </span>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Avatar Section */}
                        <div className="flex items-center space-x-8 pb-8 border-b border-gray-700">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-700 shadow-lg group-hover:border-blue-500 transition-colors bg-gray-700">
                                    {/* Resim Gösterimi (Güvenli Kontrol) */}
                                    {(preview || user.avatar) ? (
                                        <img 
                                            src={preview ? preview : getFullImageUrl(user.avatar)} 
                                            alt="Avatar" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Resim yüklenemezse gizle
                                                e.currentTarget.style.display = 'none';
                                                // Ve onun yerine harf göster (next sibling)
                                                const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                                if(nextEl) nextEl.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    
                                    {/* Resim Yoksa veya Yüklenemezse Baş Harf */}
                                    <div 
                                        className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 absolute top-0 left-0"
                                        style={{ display: (preview || user.avatar) ? 'none' : 'flex' }}
                                    >
                                        {user.username ? user.username[0].toUpperCase() : '?'}
                                    </div>
                                </div>
                                
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full cursor-pointer hover:bg-blue-500 transition-all shadow-lg transform group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Profile Picture</h3>
                                <p className="text-gray-400 text-sm">Upload a professional photo (PNG, JPG).</p>
                            </div>
                        </div>

                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Job Title / Position</label>
                                <input 
                                    type="text" 
                                    value={position} 
                                    onChange={(e) => setPosition(e.target.value)} 
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
                                    placeholder="e.g. Senior Frontend Developer" 
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-700">
                            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg font-medium transition-colors mr-4">
                                Cancel
                            </button>
                            <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-all transform hover:scale-105">
                                Save Changes
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
};

export default Profile;