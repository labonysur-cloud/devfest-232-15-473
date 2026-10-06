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
    title: lang === 'en' ? 'Nothipath' : 'নথিপাঠ',
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
            
            {/* PDF Upload Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {lang === 'en' ? 'Uploaded Documents' : 'আপলোড করা নথিপত্র'}
                </h2>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Upload PDFs' : 'PDF আপলোড করুন'}</span>
                  <input type="file" accept=".pdf" multiple className="hidden" onChange={async (e) => {
                    const newFiles = Array.from(e.target.files || []);
                    if (!newFiles.length) return;
                    
                    const { processPdfFile } = await import('./utils');
                    const processedFiles: UploadedFile[] = [];
                    
                    for (const file of newFiles) {
                      if (file.type !== 'application/pdf') continue;
                      
                      const result = await processPdfFile(file);
                      if (result) {
                        // Check for duplicates
                        const isDuplicate = files.some(f => f.contentHash === result.hash) || 
                                            processedFiles.some(f => f.contentHash === result.hash);
                                            
                        processedFiles.push({
                          id: Math.random().toString(36).substring(7),
                          file,
                          name: file.name,
                          pageCount: result.pageCount,
                          isDuplicate,
                          contentHash: result.hash
                        });
                      }
                    }
                    setFiles(prev => [...prev, ...processedFiles]);
                  }} />
                </label>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  {lang === 'en' ? 'No files uploaded yet' : 'এখনও কোনো ফাইল আপলোড করা হয়নি'}
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map(f => (
                    <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border ${f.isDuplicate ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className={`w-5 h-5 flex-shrink-0 ${f.isDuplicate ? 'text-red-500' : 'text-blue-500'}`} />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-xs text-slate-500">
                            {f.pageCount} {lang === 'en' ? 'pages' : 'পৃষ্ঠা'}
                            {f.isDuplicate && (
                              <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                                ({lang === 'en' ? 'Duplicate Content' : 'ডুপ্লিকেট কন্টেন্ট'})
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
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements Matching Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Match Documents' : 'নথি মিলান'}
              </h2>
              
              <div className="space-y-4">
                {reqData.requirements.map(req => {
                  const currentMatch = matches.find(m => m.requirementId === req.id);
                  const matchedFile = files.find(f => f.id === currentMatch?.fileId);
                  
                  // Calculate Status
                  let status: StatusType = 'Missing';
                  let statusColor = 'text-red-600 bg-red-50 border-red-200';
                  
                  if (!currentMatch) {
                    if (!req.mandatory) {
                      status = 'Not provided';
                      statusColor = 'text-slate-600 bg-slate-50 border-slate-200';
                    }
                  } else {
                    if (req.has_expiry) {
                      if (!currentMatch.expiryDate) {
                        status = 'Expiry date needed';
                        statusColor = 'text-orange-600 bg-orange-50 border-orange-200';
                      } else {
                        const expiry = new Date(currentMatch.expiryDate);
                        const deadline = new Date(reqData.tender.submission_deadline);
                        // Expiry must be ON or AFTER the submission deadline
                        expiry.setHours(0,0,0,0);
                        deadline.setHours(0,0,0,0);
                        if (expiry < deadline) {
                          status = 'Expired';
                          statusColor = 'text-red-600 bg-red-50 border-red-200';
                        } else {
                          status = 'OK';
                          statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        }
                      }
                    } else {
                      status = 'OK';
                      statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    }
                  }

                  // Available files (not duplicate, and not already matched to another requirement)
                  const availableFiles = files.filter(f => 
                    !f.isDuplicate && 
                    (!matches.some(m => m.fileId === f.id) || currentMatch?.fileId === f.id)
                  );

                  return (
                    <div key={req.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{req.order}. {lang === 'en' ? req.title_en : req.title_bn}</span>
                            {req.mandatory && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">*</span>}
                          </div>
                        </div>
                        <div className={`text-xs px-3 py-1 border rounded-full font-medium ${statusColor} whitespace-nowrap`}>
                          {status}
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-3">
                        <select 
                          className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-sm"
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
                          <option value="">-- {lang === 'en' ? 'Select a file' : 'একটি ফাইল নির্বাচন করুন'} --</option>
                          {availableFiles.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.pageCount} p)</option>
                          ))}
                        </select>
                        
                        {req.has_expiry && currentMatch && (
                          <input 
                            type="date"
                            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-sm w-full md:w-auto"
                            value={currentMatch.expiryDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMatches(prev => prev.map(m => 
                                m.requirementId === req.id ? { ...m, expiryDate: val } : m
                              ));
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Package Generation Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {lang === 'en' ? 'Generate Final Package' : 'চূড়ান্ত প্যাকেজ তৈরি করুন'}
              </h2>
              
              {(() => {
                // Determine if there are blocking statuses
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
                  <div className="flex flex-col items-center">
                    {isBlocked ? (
                      <div className="mb-4 p-4 w-full bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                        <p className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {lang === 'en' ? 'Cannot generate package due to the following errors:' : 'নিচের ত্রুটিগুলির কারণে প্যাকেজ তৈরি করা যাচ্ছে না:'}
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {blockings.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <div className="mb-4 p-4 w-full bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        {lang === 'en' ? 'All requirements met! Ready to generate.' : 'সব প্রয়োজনীয়তা পূরণ হয়েছে! তৈরি করতে প্রস্তুত।'}
                      </div>
                    )}

                    <button 
                      disabled={isBlocked}
                      onClick={async () => {
                        const { generatePackage } = await import('./pdf-generator');
                        const pdfBytes = await generatePackage(reqData, files, matches);
                        if (pdfBytes) {
                          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
                      className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                    >
                      {lang === 'en' ? 'Generate & Download Package' : 'প্যাকেজ তৈরি এবং ডাউনলোড করুন'}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
