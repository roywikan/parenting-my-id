import { useState, useEffect } from 'react';
import { Post, AutoLink, User } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './views/HomeView';
import ArticleDetailView from './views/ArticleDetailView';
import AdminPortal from './views/AdminPortal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'admin'>('home');
  const [activeSlug, setActiveSlug] = useState<string>('');

  const [posts, setPosts] = useState<Post[]>([]);
  const [autolinks, setAutolinks] = useState<AutoLink[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch Posts & Autolinks on initial mount
  useEffect(() => {
    fetchPosts();
    fetchAutolinks();

    // Check saved session
    const savedUser = localStorage.getItem('parenting_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('parenting_user');
      }
    }
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchAutolinks = async () => {
    try {
      const res = await fetch('/api/autolinks');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setAutolinks(data);
      }
    } catch (err) {
      console.error('Error fetching autolinks:', err);
    }
  };

  // Handle Login
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('parenting_user', JSON.stringify(data.user));
          return true;
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parenting_user');
    setCurrentView('home');
  };

  // Handle Save Post (Create / Update / Draft)
  const handleSavePost = async (postData: Partial<Post>): Promise<Post | void> => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchPosts();
        return data.post;
      }
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (id: number) => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle Add Autolink
  const handleAddAutolink = async (linkData: Partial<AutoLink>) => {
    try {
      const res = await fetch('/api/autolinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      });
      if (res.ok) {
        await fetchAutolinks();
      }
    } catch (err) {
      console.error('Error adding autolink:', err);
    }
  };

  // Handle Delete Autolink
  const handleDeleteAutolink = async (id: number) => {
    try {
      const res = await fetch(`/api/autolinks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAutolinks();
      }
    } catch (err) {
      console.error('Error deleting autolink:', err);
    }
  };

  // Navigation Helper
  const handleNavigate = (view: string, param?: string) => {
    if (view === 'article' && param) {
      setActiveSlug(param);
      setCurrentView('article');
    } else if (view === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
      setActiveSlug('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'home' && (
          <HomeView
            posts={posts}
            autolinks={autolinks}
            onSelectPost={(slug) => handleNavigate('article', slug)}
            onSelectCategory={() => {}}
          />
        )}

        {currentView === 'article' && (
          <ArticleDetailView
            slug={activeSlug}
            posts={posts}
            autolinks={autolinks}
            onBack={() => handleNavigate('home')}
            onSelectPost={(slug) => handleNavigate('article', slug)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            onLogin={handleLogin}
            posts={posts}
            autolinks={autolinks}
            onSavePost={handleSavePost}
            onDeletePost={handleDeletePost}
            onAddAutolink={handleAddAutolink}
            onDeleteAutolink={handleDeleteAutolink}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
