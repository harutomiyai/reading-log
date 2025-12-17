import React, { useState, useEffect } from 'react';
import { Book, Clock, Plus, BarChart2, Play, StopCircle, CheckCircle, Trash2, PenTool, Tag, Edit, X, PieChart, LayoutGrid, List, Image as ImageIcon, Bookmark, ArrowRight } from 'lucide-react';

export default function App() {
  // --- データ管理 ---
  const [view, setView] = useState('dashboard'); // dashboard, add, stats, focus, wishlist
  const [books, setBooks] = useState([]);        // 本のリスト
  const [logs, setLogs] = useState([]);          // 読書記録ログ
  const [activeSession, setActiveSession] = useState(null); // 現在読書中データ
  const [displayMode, setDisplayMode] = useState('list'); // 'list' or 'gallery' (PC用表示モード)

  // --- フォーム用データ ---
  const [editingId, setEditingId] = useState(null);
  const [inputTitle, setInputTitle] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');
  const [inputCategory, setInputCategory] = useState('文芸書');
  const [inputCoverUrl, setInputCoverUrl] = useState(''); // 画像URL用ステート

  // カテゴリー定義とテーマカラーの紐付け
  const CATEGORY_SETTINGS = {
    "文芸書": { color: "bg-purple-500", code: "#a855f7" },
    "ビジネス書・経済・経営": { color: "bg-blue-600", code: "#2563eb" },
    "実用書": { color: "bg-emerald-500", code: "#10b981" },
    "絵本・児童書": { color: "bg-orange-400", code: "#fb923c" },
    "学習参考書": { color: "bg-cyan-500", code: "#06b6d4" },
    "専門書": { color: "bg-slate-600", code: "#475569" },
    "コミック・雑誌": { color: "bg-pink-500", code: "#ec4899" }
  };

  const categories = Object.keys(CATEGORY_SETTINGS);

  // --- 初期ロード ---
  useEffect(() => {
    const savedBooks = localStorage.getItem('reading_app_books');
    const savedLogs = localStorage.getItem('reading_app_logs');
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // --- データ保存 ---
  useEffect(() => { localStorage.setItem('reading_app_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('reading_app_logs', JSON.stringify(logs)); }, [logs]);

  // --- フォームリセット ---
  const resetForm = () => {
    setEditingId(null);
    setInputTitle('');
    setInputAuthor('');
    setInputCategory('文芸書');
    setInputCoverUrl('');
  };

  // --- 編集モード開始 ---
  const startEditingBook = (e, book) => {
    e.stopPropagation();
    setEditingId(book.id);
    setInputTitle(book.title);
    setInputAuthor(book.authors[0]);
    setInputCategory(book.category || '文芸書');
    setInputCoverUrl(book.coverType === 'url' ? book.coverValue : '');
    setView('add');
  };

  // --- 本の保存 (新規/更新) ---
  // targetStatus: 'reading' (本棚) or 'wish' (読みたい本)
  const handleSaveBook = (targetStatus = 'reading') => {
    if (!inputTitle.trim()) { alert('本のタイトルを入力してください'); return; }

    let coverType = 'color';
    let coverValue = CATEGORY_SETTINGS[inputCategory]?.color || "bg-gray-500";

    if (inputCoverUrl.trim()) {
      coverType = 'url';
      coverValue = inputCoverUrl.trim();
    }

    if (editingId) {
      setBooks(prev => prev.map(book => book.id === editingId ? {
        ...book,
        title: inputTitle,
        authors: [inputAuthor || '著者不明'],
        category: inputCategory,
        coverType: coverType,
        coverValue: coverValue
        // 編集時はステータスを変更しない（必要なら別途機能追加）
      } : book));
    } else {
      const newBook = {
        id: Date.now().toString(),
        title: inputTitle,
        authors: [inputAuthor || '著者不明'],
        category: inputCategory,
        status: targetStatus, // 指定されたステータスで登録
        addedAt: new Date().toISOString(),
        completedAt: null,
        coverType: coverType,
        coverValue: coverValue
      };
      setBooks(prev => [newBook, ...prev]);
    }
    resetForm();
    // 登録した先に応じた画面に戻る
    if (targetStatus === 'wish') {
      setView('wishlist');
    } else {
      setView('dashboard');
    }
  };

  // --- 削除・完了・移動処理 ---
  const deleteBook = (e, bookId) => {
    e.stopPropagation();
    if (confirm('この本を削除しますか？\n（関連する読書ログも削除されます）')) {
      setBooks(prev => prev.filter(b => b.id !== bookId));
      setLogs(prev => prev.filter(l => l.bookId !== bookId));
    }
  };

  const completeBook = (e, bookId) => {
    e.stopPropagation();
    if (confirm('読み終わりましたか？')) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'completed', completedAt: new Date().toISOString() } : b));
    }
  };

  // 読みたい本 -> 本棚へ移動
  const moveToReading = (e, bookId) => {
    e.stopPropagation();
    if (confirm('この本を読み始めますか？\n（本棚に移動します）')) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: 'reading', addedAt: new Date().toISOString() } : b));
      setView('dashboard');
    }
  };

  // --- タイマー処理 ---
  const startReading = (book) => {
    setActiveSession({ bookId: book.id, bookTitle: book.title, startTime: new Date() });
    setView('focus');
  };

  const stopReading = () => {
    if (!activeSession) return;
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
    setLogs(prev => [{
      id: Date.now().toString(),
      bookId: activeSession.bookId,
      startTime: activeSession.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds: durationSeconds
    }, ...prev]);
    setActiveSession(null);
    setView('dashboard');
  };

  // --- ヘルパー関数 ---
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}時間 ${m}分` : `${m}分`;
  };

  // --- コンポーネント: 没入モード ---
  const FocusMode = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
    if (!activeSession) return null;
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center animate-fade-in">
        <div className="absolute top-8 left-8 text-gray-400 text-sm">Reading: {activeSession.bookTitle}</div>
        <div className="text-center space-y-12">
          <div className="space-y-2">
            <p className="text-gray-500 text-sm tracking-widest uppercase">Current Time</p>
            <h1 className="text-6xl md:text-8xl font-mono font-light tracking-wider">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h1>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-sm tracking-widest uppercase">Started At</p>
            <h2 className="text-3xl md:text-4xl font-mono text-gray-300">{activeSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2>
          </div>
        </div>
        <div className="absolute bottom-12">
          <button onClick={stopReading} className="group flex flex-col items-center space-y-2 text-gray-500 hover:text-red-400 transition-colors duration-300">
            <StopCircle size={64} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={1} />
            <span className="text-xs tracking-widest uppercase">Stop Session</span>
          </button>
        </div>
      </div>
    );
  };

  // --- コンポーネント: 円グラフ ---
  const CategoryPieChart = () => {
    const stats = {};
    categories.forEach(cat => stats[cat] = 0);

    logs.forEach(log => {
      const book = books.find(b => b.id === log.bookId);
      if (book && book.category) {
        stats[book.category] = (stats[book.category] || 0) + log.durationSeconds;
      }
    });

    const totalSeconds = Object.values(stats).reduce((a, b) => a + b, 0);
    if (totalSeconds === 0) return <div className="text-center text-gray-400 py-10">データがありません</div>;

    let currentDeg = 0;
    const gradients = categories.map(cat => {
      const value = stats[cat];
      if (value === 0) return null;
      const deg = (value / totalSeconds) * 360;
      const color = CATEGORY_SETTINGS[cat].code;
      const str = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
      currentDeg += deg;
      return str;
    }).filter(Boolean).join(', ');

    const pieStyle = { background: `conic-gradient(${gradients})` };

    return (
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex justify-center flex-1">
          <div className="w-48 h-48 rounded-full shadow-inner relative" style={pieStyle}>
            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
               <span className="text-xs text-gray-400">TOTAL</span>
               <span className="text-lg font-bold text-gray-800">{formatDuration(totalSeconds)}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full grid grid-cols-1 gap-2">
          {categories.map(cat => {
            const val = stats[cat];
            if (val === 0) return null;
            const percentage = Math.round((val / totalSeconds) * 100);
            return (
              <div key={cat} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100">
                 <div className="flex items-center gap-2">
                   <span className={`w-3 h-3 rounded-full ${CATEGORY_SETTINGS[cat].color}`}></span>
                   <span>{cat}</span>
                 </div>
                 <div className="flex gap-4 text-gray-500 text-xs">
                   <span>{formatDuration(val)}</span>
                   <span className="font-bold w-8 text-right">{percentage}%</span>
                 </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  // --- PC用サイドバーボタン ---
  const SidebarButton = ({ targetView, icon: Icon, label }) => (
    <button
      onClick={() => { resetForm(); setView(targetView); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left font-medium
        ${view === targetView ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // --- スマホ用ナビボタン ---
  const NavButton = ({ targetView, icon: Icon, label, onClick }) => (
    <button 
      onClick={onClick || (() => { resetForm(); setView(targetView); })} 
      className={`relative p-2 rounded-full flex flex-col items-center justify-center w-full transition-colors ${view === targetView ? 'text-indigo-600' : 'text-gray-400'}`}
    >
      <Icon size={24} strokeWidth={view === targetView ? 2.5 : 2} />
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );

  // --- 本のカード表示コンポーネント (Dashboard/Wishlist共通) ---
  const BookCard = ({ book, isWishlist = false }) => {
    const totalSeconds = logs.filter(l => l.bookId === book.id).reduce((acc, log) => acc + log.durationSeconds, 0);
    
    if (displayMode === 'gallery') {
      return (
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:shadow-md transition">
            <div className={`w-full aspect-[2/3] rounded overflow-hidden shadow-inner flex items-center justify-center text-white text-center p-2 ${book.coverType === 'url' ? 'bg-gray-200' : book.coverValue}`}>
              {book.coverType === 'url' ? (
                <img src={book.coverValue} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt="" />
              ) : (
                <span className="font-bold text-sm line-clamp-4">{book.title}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold line-clamp-2 text-sm mb-1">{book.title}</h3>
              <p className="text-xs text-gray-400 mb-2">{book.authors[0]}</p>
              {book.category && <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-medium mb-2">{book.category}</span>}
              {!isWishlist && <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12}/> {formatDuration(totalSeconds)}</div>}
            </div>
            <div className="flex gap-2 mt-auto pt-2 border-t">
              {isWishlist ? (
                <button onClick={(e) => moveToReading(e, book.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"><ArrowRight size={14}/> 読む</button>
              ) : (
                book.status === 'reading' ? (
                  <button onClick={() => startReading(book)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"><Play size={14}/> 読む</button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-center text-xs font-bold">完了</div>
                )
              )}
              <div className="flex gap-1">
                <button onClick={(e) => startEditingBook(e, book)} className="text-gray-300 hover:text-indigo-500 p-2"><Edit size={16}/></button>
                <button onClick={(e) => deleteBook(e, book.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
              </div>
            </div>
         </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className={`w-20 h-28 rounded flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center text-white text-center p-1 ${book.coverType === 'url' ? 'bg-gray-200' : book.coverValue}`}>
           {book.coverType === 'url' ? (
             <img src={book.coverValue} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt="" />
           ) : (
             <span className="font-bold text-xs line-clamp-3 leading-tight">{book.title}</span>
           )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-bold line-clamp-2 text-sm">{book.title}</h3>
              <div className="flex gap-1">
                <button onClick={(e) => startEditingBook(e, book)} className="text-gray-300 hover:text-indigo-500 p-1"><Edit size={16}/></button>
                <button onClick={(e) => deleteBook(e, book.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
              </div>
            </div>
            {book.category && <div className="mb-1"><span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-medium">{book.category}</span></div>}
            <p className="text-xs text-gray-400">{book.authors[0]}</p>
            {!isWishlist && <div className="mt-2 flex items-center gap-1 text-xs text-gray-500"><Clock size={12}/> {formatDuration(totalSeconds)}</div>}
          </div>
          <div className="flex gap-2 mt-2">
            {isWishlist ? (
               <button onClick={(e) => moveToReading(e, book.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow"><ArrowRight size={14}/> 読む</button>
            ) : (
              book.status === 'reading' ? (
                <><button onClick={() => startReading(book)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow"><Play size={14}/> 読む</button><button onClick={(e) => completeBook(e, book.id)} className="px-3 bg-green-50 text-green-600 rounded-lg border border-green-200"><CheckCircle size={18}/></button></>
              ) : (<div className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-center text-xs font-bold">完了</div>)
            )}
          </div>
        </div>
      </div>
    );
  };

  // メインの表示書籍（本棚用）: 読書中 or 完了
  const dashboardBooks = books.filter(b => b.status === 'reading' || b.status === 'completed');
  // 読みたい本用
  const wishlistBooks = books.filter(b => b.status === 'wish');

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {view === 'focus' && <FocusMode />}

      {/* PC用サイドバー */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Book className="text-indigo-600" /> Log
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarButton targetView="dashboard" icon={Book} label="本棚" />
          <SidebarButton targetView="wishlist" icon={Bookmark} label="読みたい本" />
          <SidebarButton targetView="add" icon={Plus} label="本を追加" />
          <SidebarButton targetView="stats" icon={BarChart2} label="読書記録" />
        </nav>
        <div className="p-4 text-xs text-gray-400 text-center">
          Reading Log App
        </div>
      </aside>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* スマホ用ヘッダー */}
        <header className="md:hidden bg-white shadow-sm sticky top-0 z-10 flex-shrink-0">
          <div className="px-4 h-16 flex items-center justify-center">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Book className="text-indigo-600" /> Log</h1>
          </div>
        </header>

        {/* スクロール領域 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          
          {/* --- ダッシュボード (本棚) --- */}
          {view === 'dashboard' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">本棚 ({dashboardBooks.length})</h2>
                 <div className="hidden md:flex bg-white rounded-lg border p-1 gap-1">
                   <button onClick={() => setDisplayMode('list')} className={`p-2 rounded ${displayMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={20} /></button>
                   <button onClick={() => setDisplayMode('gallery')} className={`p-2 rounded ${displayMode === 'gallery' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={20} /></button>
                 </div>
              </div>

              {dashboardBooks.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 mb-4">本棚は空です</p>
                  <button onClick={() => setView('add')} className="bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg">本を追加する</button>
                </div>
              ) : (
                <div className={`${displayMode === 'gallery' ? 'hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
                  {dashboardBooks.map(book => <BookCard key={book.id} book={book} />)}
                </div>
              )}
            </div>
          )}

          {/* --- 読みたい本リスト --- */}
          {view === 'wishlist' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold flex items-center gap-2"><Bookmark className="text-indigo-600"/> 読みたい本 ({wishlistBooks.length})</h2>
                 {/* PCのみ表示切り替えボタン */}
                 <div className="hidden md:flex bg-white rounded-lg border p-1 gap-1">
                   <button onClick={() => setDisplayMode('list')} className={`p-2 rounded ${displayMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={20} /></button>
                   <button onClick={() => setDisplayMode('gallery')} className={`p-2 rounded ${displayMode === 'gallery' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={20} /></button>
                 </div>
              </div>

              {wishlistBooks.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 mb-4">読みたい本はまだ登録されていません</p>
                  <button onClick={() => setView('add')} className="bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg">本を探して追加</button>
                </div>
              ) : (
                <div className={`${displayMode === 'gallery' ? 'hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
                  {wishlistBooks.map(book => <BookCard key={book.id} book={book} isWishlist={true} />)}
                </div>
              )}
            </div>
          )}

          {/* --- 登録・編集画面 --- */}
          {view === 'add' && (
            <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border space-y-6 relative animate-fade-in mt-6 md:mt-0">
              <button onClick={() => { resetForm(); setView('dashboard'); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
              <h2 className="text-lg font-bold flex items-center gap-2"><PenTool size={20} className="text-indigo-600"/> {editingId ? '情報を編集' : '本を登録'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本のタイトル <span className="text-red-500">*</span></label>
                  <input type="text" value={inputTitle} onChange={(e) => setInputTitle(e.target.value)} placeholder="例: 嫌われる勇気" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">著者名</label>
                  <input type="text" value={inputAuthor} onChange={(e) => setInputAuthor(e.target.value)} placeholder="例: 岸見 一郎" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-3 text-gray-400" />
                    <select value={inputCategory} onChange={(e) => setInputCategory(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm">
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表紙画像 (URL)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" value={inputCoverUrl} onChange={(e) => setInputCoverUrl(e.target.value)} placeholder="https://..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">※空欄の場合はカテゴリーの色が適用されます</p>
                  
                  <div className="mt-4 flex justify-center">
                    <div className={`w-24 h-32 rounded shadow-md flex items-center justify-center text-white text-center p-2 text-xs font-bold overflow-hidden ${inputCoverUrl ? 'bg-gray-100' : (CATEGORY_SETTINGS[inputCategory]?.color || 'bg-gray-500')}`}>
                      {inputCoverUrl ? (
                         <img src={inputCoverUrl} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt="" />
                      ) : (
                         <span>{inputTitle || 'タイトル'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 flex-col sm:flex-row">
                  {editingId ? (
                    <button onClick={() => handleSaveBook('reading')} className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-black transition">更新する</button>
                  ) : (
                    <>
                      <button onClick={() => handleSaveBook('reading')} className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-black transition">本棚に登録<br/><span className="text-[10px] font-normal opacity-80">今すぐ読む</span></button>
                      <button onClick={() => handleSaveBook('wish')} className="flex-1 bg-indigo-100 text-indigo-700 py-3 rounded-lg font-bold hover:bg-indigo-200 transition">読みたい本に登録<br/><span className="text-[10px] font-normal opacity-80">後で読む</span></button>
                    </>
                  )}
                </div>
                {editingId && (
                   <button onClick={() => { resetForm(); setView('dashboard'); }} className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-200 transition mt-2">キャンセル</button>
                )}
              </div>
            </div>
          )}

          {/* --- 統計画面 --- */}
          {view === 'stats' && (
            <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieChart size={20} className="text-indigo-600"/> カテゴリー別読書時間</h3>
                 <CategoryPieChart />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border text-center"><p className="text-xs text-gray-500">総読書時間</p><p className="text-2xl font-bold text-indigo-600">{formatDuration(logs.reduce((a, l) => a + l.durationSeconds, 0))}</p></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border text-center"><p className="text-xs text-gray-500">完読冊数</p><p className="text-2xl font-bold text-green-600">{dashboardBooks.filter(b => b.status === 'completed').length}</p></div>
              </div>

              <div>
                <h3 className="font-bold text-gray-500 text-sm mb-2">最近の履歴</h3>
                <div className="space-y-2">
                  {logs.length === 0 && <p className="text-gray-400 text-sm">履歴はまだありません</p>}
                  {logs.slice().reverse().slice(0, 10).map(log => {
                    const book = books.find(b => b.id === log.bookId);
                    return (
                      <div key={log.id} className="bg-white p-3 rounded-lg border flex justify-between text-sm"><div className="truncate pr-2"><span className="block font-bold truncate">{book?.title || '削除済'}</span><span className="text-xs text-gray-400">{new Date(log.startTime).toLocaleDateString()}</span></div><span className="font-mono text-gray-600 whitespace-nowrap">{Math.floor(log.durationSeconds/60)}分</span></div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* スマホ用ボトムナビゲーション (md以上で隠す) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex justify-around items-center z-40 safe-area-padding-bottom">
           <NavButton targetView="dashboard" icon={Book} label="本棚" />
           <NavButton targetView="wishlist" icon={Bookmark} label="読みたい" />
           <NavButton targetView="add" icon={Plus} label="追加" />
           <NavButton targetView="stats" icon={BarChart2} label="記録" />
        </nav>
      </div>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .safe-area-padding { padding-bottom: env(safe-area-inset-bottom); }
        .safe-area-padding-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}