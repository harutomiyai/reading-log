import React, { useState, useEffect, useRef } from 'react';
import { Book, Clock, Plus, BarChart2, Play, StopCircle, CheckCircle, Trash2, PenTool, Image as ImageIcon, Palette, Bell, Settings, ArrowLeft } from 'lucide-react';

export default function App() {
  // --- データ管理 ---
  const [view, setView] = useState('dashboard'); // dashboard, add, stats, focus, reminders
  const [books, setBooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // --- リマインダー設定データ (曜日ごとの時間) ---
  // 例: { Mon: '20:00', Tue: '', ... } 空文字はOFF
  const [reminders, setReminders] = useState({
    Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: ''
  });
  const [permission, setPermission] = useState('default'); // 通知許可状態

  // --- 手動登録用の入力データ ---
  const [inputTitle, setInputTitle] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');
  const [coverType, setCoverType] = useState('color');
  const [coverValue, setCoverValue] = useState('bg-indigo-500');

  const colorOptions = [
    'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500',
    'bg-green-500', 'bg-teal-500', 'bg-sky-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'
  ];

  const daysMap = [
    { key: 'Mon', label: '月曜日' },
    { key: 'Tue', label: '火曜日' },
    { key: 'Wed', label: '水曜日' },
    { key: 'Thu', label: '木曜日' },
    { key: 'Fri', label: '金曜日' },
    { key: 'Sat', label: '土曜日' },
    { key: 'Sun', label: '日曜日' },
  ];

  // --- 初期ロード ---
  useEffect(() => {
    const savedBooks = localStorage.getItem('reading_app_books');
    const savedLogs = localStorage.getItem('reading_app_logs');
    const savedReminders = localStorage.getItem('reading_app_reminders');
    
    if (savedBooks) setBooks(JSON.parse(savedBooks));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    // 通知許可の確認
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // --- データ保存 ---
  useEffect(() => { localStorage.setItem('reading_app_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('reading_app_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('reading_app_reminders', JSON.stringify(reminders)); }, [reminders]);

  // --- リマインダーのチェック処理 (1分ごとに確認) ---
  useEffect(() => {
    const checkReminders = () => {
      if (permission !== 'granted') return;

      const now = new Date();
      // 現在の曜日 (Mon, Tue...)
      const dayStr = now.toLocaleDateString('en-US', { weekday: 'short' });
      // 現在の時刻 (HH:mm) 0埋め
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      // 設定時刻と一致したら通知
      if (reminders[dayStr] === timeStr) {
        new Notification('読書の時間です📖', {
          body: 'リラックスして、本の世界へ行きましょう。',
          icon: '/pwa-192x192.png' // アイコンがあれば表示
        });
      }
    };

    // 00秒ぴったりに動くように調整しても良いが、簡易的に30秒ごとにチェック
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, permission]);

  // --- 通知許可のリクエスト ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知に対応していません。');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('設定完了', { body: 'これから設定した時間に通知が届きます！' });
    }
  };

  // --- 機能: 本の登録など ---
  const handleAddBook = () => {
    if (!inputTitle.trim()) { alert('本のタイトルを入力してください'); return; }
    const newBook = {
      id: Date.now().toString(),
      title: inputTitle,
      authors: [inputAuthor || '著者不明'],
      status: 'reading',
      addedAt: new Date().toISOString(),
      completedAt: null,
      coverType: coverType, 
      coverValue: coverValue
    };
    setBooks(prev => [newBook, ...prev]);
    setInputTitle(''); setInputAuthor(''); setCoverType('color'); setCoverValue('bg-indigo-500');
    setView('dashboard');
  };

  const deleteBook = (e, bookId) => {
    e.stopPropagation();
    if (confirm('この本を削除しますか？')) {
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

  const updateReminder = (dayKey, time) => {
    setReminders(prev => ({ ...prev, [dayKey]: time }));
  };

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

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}時間 ${m}分` : `${m}分`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 safe-area-padding">
      {view === 'focus' && <FocusMode />}

      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Book className="text-indigo-600" /> Log
          </h1>
          <nav className="flex gap-2">
            <button onClick={() => setView('reminders')} className={`p-2 rounded-full ${view === 'reminders' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><Bell size={24} /></button>
            <button onClick={() => setView('dashboard')} className={`p-2 rounded-full ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><Book size={24} /></button>
            <button onClick={() => setView('add')} className={`p-2 rounded-full ${view === 'add' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><Plus size={24} /></button>
            <button onClick={() => setView('stats')} className={`p-2 rounded-full ${view === 'stats' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}><BarChart2 size={24} /></button>
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        
        {/* --- ダッシュボード --- */}
        {view === 'dashboard' && (
          <div className="space-y-4">
            {books.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">右上の ＋ ボタンから<br/>本を登録してください</p>
                <button onClick={() => setView('add')} className="bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg">本を登録する</button>
              </div>
            ) : (
              books.map(book => {
                const totalSeconds = logs.filter(l => l.bookId === book.id).reduce((acc, log) => acc + log.durationSeconds, 0);
                return (
                  <div key={book.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                    <div className={`w-20 h-28 rounded flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center text-white text-center p-1 ${book.coverType === 'color' ? book.coverValue : 'bg-gray-200'}`}>
                       {book.coverType === 'url' ? <img src={book.coverValue} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} /> : <span className="font-bold text-xs line-clamp-3 leading-tight">{book.title}</span>}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="font-bold line-clamp-2 text-sm">{book.title}</h3>
                          <button onClick={(e) => deleteBook(e, book.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{book.authors[0]}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500"><Clock size={12}/> {formatDuration(totalSeconds)}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {book.status === 'reading' ? (
                          <><button onClick={() => startReading(book)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 shadow"><Play size={14}/> 読む</button><button onClick={(e) => completeBook(e, book.id)} className="px-3 bg-green-50 text-green-600 rounded-lg border border-green-200"><CheckCircle size={18}/></button></>
                        ) : (<div className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-center text-xs font-bold">完了</div>)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* --- リマインダー設定画面 --- */}
        {view === 'reminders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Bell className="text-indigo-600" /> リマインダー設定</h2>
            
            {/* 許可状態の表示 */}
            <div className={`p-4 rounded-xl border ${permission === 'granted' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200'}`}>
              {permission === 'granted' ? (
                <div className="flex items-center gap-2"><CheckCircle size={20}/> 通知は有効です</div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-yellow-800 mb-2">通知許可が必要です</p>
                  <button onClick={requestNotificationPermission} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">通知を許可する</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border shadow-sm divide-y">
              {daysMap.map((day) => (
                <div key={day.key} className="p-4 flex items-center justify-between">
                  <span className="font-bold text-gray-700">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={reminders[day.key]} 
                      onChange={(e) => updateReminder(day.key, e.target.value)}
                      className="border rounded px-2 py-1 text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {reminders[day.key] && (
                      <button onClick={() => updateReminder(day.key, '')} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">※ 通知を受け取るにはアプリ（ブラウザ）を開いたままにしておく必要があります。</p>
          </div>
        )}

        {/* --- 登録画面 --- */}
        {view === 'add' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><PenTool size={20} className="text-indigo-600"/> 本の情報を入力</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">本のタイトル <span className="text-red-500">*</span></label><input type="text" value={inputTitle} onChange={(e) => setInputTitle(e.target.value)} placeholder="例: 嫌われる勇気" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">著者名</label><input type="text" value={inputAuthor} onChange={(e) => setInputAuthor(e.target.value)} placeholder="例: 岸見 一郎" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"/></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">表紙の設定</label>
                <div className="flex gap-2 mb-4"><button onClick={() => setCoverType('color')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 border ${coverType === 'color' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-500'}`}><Palette size={14}/> 色を選ぶ</button><button onClick={() => setCoverType('url')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 border ${coverType === 'url' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-500'}`}><ImageIcon size={14}/> 画像URL</button></div>
                {coverType === 'color' && <div className="grid grid-cols-6 gap-2">{colorOptions.map((color) => (<button key={color} onClick={() => setCoverValue(color)} className={`w-full aspect-square rounded-full ${color} ${coverValue === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} />))}</div>}
                {coverType === 'url' && <div><input type="text" value={coverValue.startsWith('bg-') ? '' : coverValue} onChange={(e) => setCoverValue(e.target.value)} placeholder="https://..." className="w-full px-4 py-2 border rounded-lg text-sm"/><p className="text-xs text-gray-400 mt-1">※Amazonや書店の画像URLを貼り付けてください</p></div>}
                <div className="mt-4 flex justify-center"><div className={`w-24 h-32 rounded shadow-md flex items-center justify-center text-white text-center p-2 text-xs font-bold overflow-hidden ${coverType === 'color' ? coverValue : 'bg-gray-100'}`}>{coverType === 'url' && coverValue && !coverValue.startsWith('bg-') ? <img src={coverValue} className="w-full h-full object-cover" /> : <span>{inputTitle || 'タイトル'}</span>}</div></div>
              </div>
              <button onClick={handleAddBook} className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-black transition mt-4">登録する</button>
            </div>
          </div>
        )}

        {/* --- 統計画面 --- */}
        {view === 'stats' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border text-center"><p className="text-xs text-gray-500">総読書時間</p><p className="text-2xl font-bold text-indigo-600">{formatDuration(logs.reduce((a, l) => a + l.durationSeconds, 0))}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border text-center"><p className="text-xs text-gray-500">完読冊数</p><p className="text-2xl font-bold text-green-600">{books.filter(b => b.status === 'completed').length}</p></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-500 text-sm mb-2">履歴</h3>
              <div className="space-y-2">
                {logs.length === 0 && <p className="text-gray-400 text-sm">履歴はまだありません</p>}
                {logs.slice().reverse().slice(0, 20).map(log => {
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
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .safe-area-padding { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}