import { useState, useEffect } from 'react';
import { Moon, Sun, Upload, FileText, CheckCircle2, AlertCircle, XCircle, Download, FileJson, HelpCircle } from 'lucide-react';
import { RequirementsData, UploadedFile, DocumentMatch, StatusType } from './types';
import AIAssistant from './AIAssistant';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  const [reqData, setReqData] = useState<RequirementsData | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [matches, setMatches] = useState<DocumentMatch[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

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
    title: 'নথিপথ — Nothipath',
    uploadJson: lang === 'en' ? 'Start by uploading requirements.json' : 'শুরু করতে requirements.json আপলোড করুন',
    dark: lang === 'en' ? 'Dark Mode' : 'ডার্ক মোড',
    light: lang === 'en' ? 'Light Mode' : 'লাইট মোড',
    heroTitle: lang === 'en' ? 'Tender Document Package Builder' : 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    heroSub: lang === 'en' ? 'Automate your tender submission by validating, organizing, and merging your documents securely in your browser.' : 'আপনার ব্রাউজারে নিরাপদে আপনার নথিগুলিকে যাচাই, সংগঠিত এবং একত্রিত করে আপনার দরপত্র জমা দেওয়া স্বয়ংক্রিয় করুন৷'
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tender && json.requirements) {
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

  const exportCSV = () => {
    if (!reqData) return;
    const rows = [
      ['Document ID', 'Requirement', 'Mandatory', 'File Name', 'Pages', 'Expiry Date', 'Status']
    ];
    
    reqData.requirements.forEach(req => {
      const match = matches.find(m => m.requirementId === req.id);
      const file = files.find(f => f.id === match?.fileId);
      
      let status = 'Missing';
      if (!match && !req.mandatory) status = 'Not provided';
      else if (match) {
         if (req.has_expiry) {
             if (!match.expiryDate) status = 'Expiry date needed';
             else {
                 const exp = new Date(match.expiryDate);
                 const dead = new Date(reqData.tender.submission_deadline);
                 exp.setHours(0,0,0,0); dead.setHours(0,0,0,0);
                 if (exp < dead) status = 'Expired';
                 else status = 'OK';
             }
         } else {
             status = 'OK';
         }
      }
      
      rows.push([
        req.id,
        `"${req.title_en}"`,
        req.mandatory ? 'Yes' : 'No',
        file ? `"${file.name}"` : 'None',
        file ? file.pageCount.toString() : '0',
        match?.expiryDate || 'N/A',
        status
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reqData.tender.tender_id}_Checklist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processUploads = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    
    const { processPdfFile } = await import('./utils');
    const processedFiles: UploadedFile[] = [];
    const newMatches: DocumentMatch[] = [];
    
    for (const file of newFiles) {
      if (file.type !== 'application/pdf') {
         processedFiles.push({
            id: Math.random().toString(36).substring(7),
            file,
            name: file.name,
            pageCount: 0,
            isDuplicate: false,
            contentHash: '',
            error: lang === 'en' ? 'Not a valid PDF file type.' : 'একটি বৈধ PDF ফাইল নয়।'
         });
         continue;
      }
      
      const result = await processPdfFile(file);
      if (result) {
        const isDuplicate = files.some(f => f.contentHash === result.hash) || 
                            processedFiles.some(f => f.contentHash === result.hash);
                            
        const newFileId = Math.random().toString(36).substring(7);
        processedFiles.push({
          id: newFileId,
          file,
          name: file.name,
          pageCount: result.pageCount,
          isDuplicate,
          contentHash: result.hash,
          error: result.error
        });

        // Auto-match logic based on filename inclusion
        if (!result.error && !isDuplicate && reqData) {
            const fileNameLower = file.name.toLowerCase().replace(/[^a-z0-9]/g, ' ');
            const fileWords = fileNameLower.split(/\s+/).filter(w => w.length > 2);
            
            let bestMatch: any = null;
            let bestScore = 0;

            reqData.requirements.forEach(req => {
                const alreadyMatched = matches.some(m => m.requirementId === req.id) || newMatches.some(m => m.requirementId === req.id);
                if (alreadyMatched) return;
                
                const reqTitleLower = req.title_en.toLowerCase().replace(/[^a-z0-9]/g, ' ');
                const reqWords = reqTitleLower.split(/\s+/).filter(w => w.length > 2 && w !== 'certificate' && w !== 'proposal');
                
                let score = 0;
                reqWords.forEach(word => {
                    if (fileWords.includes(word)) score += 2;
                    else if (fileWords.some(fw => fw.includes(word) || word.includes(fw))) score += 1;
                });

                if (score > bestScore && score > 0) {
                    bestScore = score;
                    bestMatch = req;
                }
            });

            if (bestMatch) {
                newMatches.push({ requirementId: bestMatch.id, fileId: newFileId });
            }
        }
      }
    }
    setFiles(prev => [...prev, ...processedFiles]);
    if (newMatches.length > 0) {
        setMatches(prev => [...prev, ...newMatches]);
    }
    e.target.value = '';
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/png') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg(lang === 'en' ? 'Please upload a valid PNG image.' : 'অনুগ্রহ করে একটি বৈধ PNG ছবি আপলোড করুন।');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <header className="border-b border-white/20 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          </div>
          <div className="flex items-center gap-4">

            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Guide' : 'গাইড'}</span>
            </button>
            <button
              onClick={toggleLang}
              className="px-4 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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

      <main className="flex-grow p-6 max-w-6xl mx-auto w-full flex flex-col">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {!reqData ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center mt-12 mb-20 animate-in fade-in duration-500">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mb-6">
                <FileJson className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{t.heroTitle}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
              {t.heroSub}
            </p>
            <div className="border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-2xl p-10 w-full max-w-md bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <div className="bg-blue-600 group-hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-sm flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>{t.uploadJson}</span>
                </div>
                <input type="file" accept=".json" className="hidden" onChange={handleJsonUpload} />
                <span className="text-sm text-slate-500 dark:text-slate-400">Supported format: .json</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                {reqData.tender.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'en' ? 'Tender ID' : 'দরপত্র আইডি'}</p>
                  <p className="font-semibold text-lg">{reqData.tender.tender_id}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'en' ? 'Entity' : 'সংস্থা'}</p>
                  <p className="font-semibold text-lg">{reqData.tender.procuring_entity}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'en' ? 'Bidder' : 'দরদাতা'}</p>
                  <p className="font-semibold text-lg">{reqData.tender.bidder}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1 font-medium">{lang === 'en' ? 'Submission Deadline' : 'জমা দেওয়ার শেষ তারিখ'}</p>
                  <p className="font-bold text-lg text-red-700 dark:text-red-400">{reqData.tender.submission_deadline}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold">
                    {lang === 'en' ? 'Uploaded Documents' : 'আপলোড করা নথিপত্র'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {lang === 'en' ? 'Upload PDFs. Auto-matching is enabled based on file names.' : 'PDF আপলোড করুন। ফাইলের নামের উপর ভিত্তি করে অটো-ম্যাচিং সক্ষম।'}
                    </p>
                </div>
                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                  <Upload className="w-5 h-5" />
                  <span>{lang === 'en' ? 'Upload PDFs' : 'PDF আপলোড করুন'}</span>
                  <input type="file" accept=".pdf" multiple className="hidden" onChange={processUploads} />
                </label>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                  <Upload className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  {lang === 'en' ? 'No files uploaded yet. Select files to begin matching.' : 'এখনও কোনো ফাইল আপলোড করা হয়নি। ম্যাচিং শুরু করতে ফাইল নির্বাচন করুন।'}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map(f => (
                    <div key={f.id} className={`flex items-start justify-between p-4 rounded-xl border ${f.error ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : f.isDuplicate ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'}`}>
                      <div className="flex items-start gap-3 overflow-hidden">
                        <FileText className={`w-6 h-6 flex-shrink-0 mt-0.5 ${f.error ? 'text-red-500' : f.isDuplicate ? 'text-orange-500' : 'text-blue-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100" title={f.name}>{f.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {!f.error && `${f.pageCount} ${lang === 'en' ? 'pages' : 'পৃষ্ঠা'}`}
                            {f.error && (
                              <span className="text-red-600 dark:text-red-400 font-semibold block mt-1">
                                {f.error}
                              </span>
                            )}
                            {f.isDuplicate && !f.error && (
                              <span className="text-orange-600 dark:text-orange-400 font-semibold block mt-1">
                                {lang === 'en' ? 'Duplicate Content' : 'ডুপ্লিকেট কন্টেন্ট'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setFiles(prev => prev.filter(file => file.id !== f.id));
                          setMatches(prev => prev.filter(m => m.fileId !== f.id));
                        }}
                        className="p-1.5 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-500 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold">
                    {lang === 'en' ? 'Match Documents' : 'নথি মিলান'}
                </h2>
                <button 
                    onClick={exportCSV}
                    className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                    <Download className="w-4 h-4" />
                    {lang === 'en' ? 'Export CSV' : 'CSV এক্সপোর্ট করুন'}
                </button>
              </div>
              
              <div className="space-y-4">
                {reqData.requirements.map(req => {
                  const currentMatch = matches.find(m => m.requirementId === req.id);

                  let status: StatusType = 'Missing';
                  let statusColor = 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400';
                  
                  if (!currentMatch) {
                    if (!req.mandatory) {
                      status = 'Not provided';
                      statusColor = 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
                    }
                  } else {
                    if (req.has_expiry) {
                      if (!currentMatch.expiryDate) {
                        status = 'Expiry date needed';
                        statusColor = 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-400';
                      } else {
                        const expiry = new Date(currentMatch.expiryDate);
                        const deadline = new Date(reqData.tender.submission_deadline);
                        expiry.setHours(0,0,0,0);
                        deadline.setHours(0,0,0,0);
                        if (expiry < deadline) {
                          status = 'Expired';
                          statusColor = 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400';
                        } else {
                          status = 'OK';
                          statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400';
                        }
                      }
                    } else {
                      status = 'OK';
                      statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400';
                    }
                  }

                  const availableFiles = files.filter(f => 
                    !f.isDuplicate && 
                    !f.error &&
                    (!matches.some(m => m.fileId === f.id) || currentMatch?.fileId === f.id)
                  );

                  return (
                    <div key={req.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">{req.order}. {lang === 'en' ? req.title_en : req.title_bn}</span>
                            {req.mandatory && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full font-bold">Required</span>}
                          </div>
                        </div>
                        <div className={`text-xs px-4 py-1.5 border rounded-full font-bold shadow-sm whitespace-nowrap ${statusColor}`}>
                          {status}
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <select 
                          className="w-full md:flex-grow p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                          value={currentMatch?.fileId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setMatches(prev => prev.filter(m => m.requirementId !== req.id));
                            } else {
                              setMatches(prev => {
                                const filtered = prev.filter(m => m.requirementId !== req.id);
                                return [...filtered, { requirementId: req.id, fileId: val }];
                              });
                            }
                          }}
                        >
                          <option value="">-- {lang === 'en' ? 'Select a matching file' : 'একটি উপযুক্ত ফাইল নির্বাচন করুন'} --</option>
                          {availableFiles.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.pageCount} p)</option>
                          ))}
                        </select>
                        
                        {req.has_expiry && currentMatch && (
                          <div className="w-full md:w-auto relative">
                              <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {lang === 'en' ? 'Expiry Date' : 'মেয়াদোত্তীর্ণ তারিখ'}
                              </label>
                              <input 
                                type="date"
                                className="p-3 w-full border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                value={currentMatch.expiryDate || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMatches(prev => prev.map(m => 
                                    m.requirementId === req.id ? { ...m, expiryDate: val } : m
                                  ));
                                }}
                              />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
              <h2 className="text-2xl font-bold mb-6">
                {lang === 'en' ? 'Finalize & Generate Package' : 'চূড়ান্ত করুন এবং প্যাকেজ তৈরি করুন'}
              </h2>
              
              {(() => {
                const blockings: string[] = [];
                reqData.requirements.forEach(req => {
                  const currentMatch = matches.find(m => m.requirementId === req.id);
                  if (req.mandatory && !currentMatch) {
                    blockings.push(`${req.title_en} is missing.`);
                  } else if (currentMatch && req.has_expiry) {
                    if (!currentMatch.expiryDate) {
                      blockings.push(`${req.title_en} needs an expiry date.`);
                    } else {
                      const expiry = new Date(currentMatch.expiryDate);
                      const deadline = new Date(reqData.tender.submission_deadline);
                      expiry.setHours(0,0,0,0);
                      deadline.setHours(0,0,0,0);
                      if (expiry < deadline) {
                        blockings.push(`${req.title_en} is expired.`);
                      }
                    }
                  }
                });

                const isBlocked = blockings.length > 0;

                return (
                  <div className="flex flex-col items-center max-w-2xl mx-auto">
                    {isBlocked ? (
                      <div className="mb-8 p-5 w-full bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-left">
                        <p className="font-bold mb-3 flex items-center gap-2 text-base">
                          <AlertCircle className="w-5 h-5" />
                          {lang === 'en' ? 'Action Required Before Generation:' : 'প্যাকেজ তৈরির আগে প্রয়োজনীয় কাজ:'}
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 text-sm font-medium">
                          {blockings.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <div className="mb-8 p-5 w-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-bold text-lg">{lang === 'en' ? 'All requirements met! Ready to generate.' : 'সব প্রয়োজনীয়তা পূরণ হয়েছে! তৈরি করতে প্রস্তুত।'}</span>
                      </div>
                    )}

                    <div className="mb-6 w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{lang === 'en' ? 'Add Signature (Optional Bonus)' : 'স্বাক্ষর যোগ করুন (ঐচ্ছিক)'}</p>
                          <p className="text-xs text-slate-500">{signatureData ? (lang === 'en' ? 'Signature attached' : 'স্বাক্ষর যুক্ত করা হয়েছে') : (lang === 'en' ? 'Upload PNG only' : 'শুধুমাত্র PNG আপলোড করুন')}</p>
                        </div>
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors">
                        {lang === 'en' ? (signatureData ? 'Change' : 'Upload') : (signatureData ? 'পরিবর্তন' : 'আপলোড')}
                        <input type="file" accept="image/png" className="hidden" onChange={handleSignatureUpload} />
                      </label>
                    </div>

                    <button 
                      disabled={isBlocked}
                      onClick={async () => {
                        const { generatePackage } = await import('./pdf-generator');
                        const pdfBytes = await generatePackage(reqData, files, matches, signatureData);
                        if (pdfBytes) {
                          const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${reqData.tender.tender_id}_Package.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } else {
                          setErrorMsg(lang === 'en' ? 'Failed to generate PDF package.' : 'PDF প্যাকেজ তৈরি করতে ব্যর্থ হয়েছে।');
                        }
                      }}
                      className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                      {lang === 'en' ? 'Generate & Download PDF Package' : 'PDF প্যাকেজ তৈরি এবং ডাউনলোড করুন'}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
      
      {/* User Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-500" />
                {lang === 'en' ? 'How to Use নথিপথ — Nothipath' : 'কীভাবে নথিপথ — Nothipath ব্যবহার করবেন'}
              </h2>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6 text-slate-700 dark:text-slate-300">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{lang === 'en' ? 'Upload requirements.json' : 'requirements.json আপলোড করুন'}</h3>
                  <p>{lang === 'en' ? 'Start by uploading the requirements.json file provided in your tender pack. This tells the system exactly which documents are needed.' : 'আপনার টেন্ডার প্যাক থেকে requirements.json ফাইলটি আপলোড করে শুরু করুন। এটি সিস্টেমকে বলে দেয় ঠিক কী কী ডকুমেন্ট লাগবে।'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{lang === 'en' ? 'Upload PDF Documents' : 'PDF ডকুমেন্ট আপলোড করুন'}</h3>
                  <p>{lang === 'en' ? 'Select all your PDFs. The system will automatically hash them to check for duplicates and filter out invalid files.' : 'সবগুলো PDF একসাথে আপলোড করুন। সিস্টেম স্বয়ংক্রিয়ভাবে চেক করে ডুপ্লিকেট বাদ দিয়ে দেবে।'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{lang === 'en' ? 'Match & Verify' : 'ম্যাচিং এবং যাচাই করুন'}</h3>
                  <p>{lang === 'en' ? 'Use the dropdowns to match files. The intelligent auto-match will try to do this for you. Enter expiry dates where required!' : 'ড্রপডাউন ব্যবহার করে ফাইলগুলো ম্যাচ করুন। অটো-ম্যাচ সিস্টেম আপনাকে সাহায্য করবে। যেখানে মেয়াদউত্তীর্ণের তারিখ লাগবে সেখানে তারিখ দিন।'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{lang === 'en' ? 'Generate Final Package' : 'প্যাকেজ তৈরি করুন'}</h3>
                  <p>{lang === 'en' ? 'Once all blocking issues are resolved, click generate. You can also upload a PNG signature to stamp on all pages!' : 'সব সমস্যা সমাধান হলে Generate বাটনে ক্লিক করুন। আপনি চাইলে একটি PNG স্বাক্ষরও আপলোড করতে পারেন যা সব পৃষ্ঠায় যুক্ত হবে!'}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                {lang === 'en' ? 'Got it, let\'s start!' : 'বুঝতে পেরেছি, চলুন শুরু করি!'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIAssistant reqData={reqData} matches={matches} lang={lang} />
    </div>
  );
}
