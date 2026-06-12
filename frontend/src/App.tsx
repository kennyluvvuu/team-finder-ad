import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/Header";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { ProjectList } from "./views/ProjectList";
import { ProjectDetails } from "./views/ProjectDetails";
import { UserList } from "./views/UserList";
import { UserProfile } from "./views/UserProfile";
import "./index.css";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  // Force premium dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
          {/* Top glassmorphic navbar */}
          <Header />

          {/* Main content page area */}
          <main className="flex-grow">
            <Routes>
              {/* Redirect root to projects listing page */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              
              {/* Project routes */}
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
              
              {/* Member routes */}
              <Route path="/users" element={<UserList />} />
              <Route path="/users/:id" element={<UserProfile />} />
              
              {/* Current user Profile */}
              <Route path="/profile" element={<UserProfile />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-background">
            <div className="container mx-auto px-4">
              &copy; {new Date().getFullYear()} TeamFinder. Все права защищены. Разработано с помощью Bun, React и Django.
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
