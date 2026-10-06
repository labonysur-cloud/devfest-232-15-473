import { useState, useEffect } from 'react';
import { Moon, Sun, Upload, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { RequirementsData, UploadedFile, DocumentMatch } from './types';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  const [reqData, setReqData] = useState<RequirementsData | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [matches, setMatches] = useState<DocumentMatch[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

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

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tender && json.requirements) {
          // Sort by order immediately
          json.requirements.sort((a: any, b: any) => a.order - b.order);
          setReqData(json);
          setErrorMsg('');
        } else {
          setErrorMsg(lang === 'en' ? 'Invalid JSON format' : 'অবৈধ JSON বিন্যাস');
        }
      } catch (err) {
        setErrorMsg(lang === 'en' ? 'Failed to parse JSON' : 'JSON পার্স করতে ব্যর্থ');
      }
    };
    reader.readAsText(file);
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
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {!reqData ? (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <h2 className="text-lg font-medium mb-2">{t.uploadJson}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {lang === 'en' ? 'Select your requirements.json file to begin' : 'শুরু করতে আপনার requirements.json ফাইলটি নির্বাচন করুন'}
            </p>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              <span>{lang === 'en' ? 'Select File' : 'ফাইল নির্বাচন করুন'}</span>
              <input type="file" accept=".json" className="hidden" onChange={handleJsonUpload} />
            </label>
          </div>
        ) : (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                {reqData.tender.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Tender ID' : 'দরপত্র আইডি'}</p>
                  <p className="font-medium">{reqData.tender.tender_id}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Entity' : 'সংস্থা'}</p>
                  <p className="font-medium">{reqData.tender.procuring_entity}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Bidder' : 'দরদাতা'}</p>
                  <p className="font-medium">{reqData.tender.bidder}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{lang === 'en' ? 'Deadline' : 'শেষ তারিখ'}</p>
                  <p className="font-medium text-red-600 dark:text-red-400">{reqData.tender.submission_deadline}</p>
                </div>
              </div>
            </div>
            
            {/* The rest of the UI will go here */}
            <div className="text-center py-10 text-slate-500">
              {lang === 'en' ? 'JSON loaded successfully. Next step: PDF upload UI.' : 'JSON সফলভাবে লোড হয়েছে। পরবর্তী ধাপ: PDF আপলোড UI।'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
