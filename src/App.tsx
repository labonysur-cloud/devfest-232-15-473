import { useState, useEffect } from 'react';
import { Moon, Sun, Upload, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

  const t = {
    title: lang === 'en' ? 'Tender Document Package Builder' : 'দরপত্র নথি প্যাকেজ নির্মাতা',
    uploadJson: lang === 'en' ? 'Upload requirements.json' : 'requirements.json আপলোড করুন',
    dark: lang === 'en' ? 'Dark Mode' : 'ডার্ক মোড',
    light: lang === 'en' ? 'Light Mode' : 'লাইট মোড',
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={theme === 'light' ? t.dark : t.light}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 max-w-6xl mx-auto w-full">
        {/* Placeholder for requirements.json dropzone */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800/50">
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-medium mb-2">{t.uploadJson}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'en' ? 'Drag and drop your requirements.json file here' : 'আপনার requirements.json ফাইলটি এখানে টেনে আনুন'}
          </p>
        </div>
      </main>
    </div>
  );
}
