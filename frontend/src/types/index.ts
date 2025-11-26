
export interface User {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
}


export interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high'; 
    order: number;
    due_date?: string;
    assigned_to?: number; 
}


export interface Column {
    id: number;
    title: string;
    order: number;
    tasks: Task[]; 
}


export interface Board {
    id: number;
    name: string;
    description: string;
    owner_username: string;
    created_at: string;
    columns: Column[]; 
}