import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardDetail from './pages/BoardDetail';
import Register from './pages/Register';
import Profile from './pages/Profile'; // <-- BU SATIR VAR MI?

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    return token ? <>{children}</> : <Navigate to="/" />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Herkese Açık Rotalar */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Korumalı Rotalar (Sadece giriş yapanlar) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/board/:id" 
                    element={
                        <PrivateRoute>
                            <BoardDetail />
                        </PrivateRoute>
                    } 
                />
                {/* --- İŞTE BURASI EKSİK OLABİLİR --- */}
                <Route 
                    path="/profile" 
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } 
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;