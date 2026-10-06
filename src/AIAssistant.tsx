import { useState, useEffect } from 'react';
import { Bot, X, Loader2, Key } from 'lucide-react';
import { askAI } from './ai';
import { RequirementsData, DocumentMatch } from './types';

export default function AIAssistant({ 
  reqData, 
  matches, 
  lang 
}: { 
  reqData: RequirementsData | null; 
  matches: DocumentMatch[];
  lang: 'en' | 'bn';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>('');
  
  // Fallback to Vercel env if available, otherwise check localStorage
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isKeyInputOpen, setIsKeyInputOpen] = useState(false);
  
  const envApiKey = import.meta.env.VITE_GROQ_API_KEY || '';

  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const saveKey = (key: string) => {
    localStorage.setItem('groq_api_key', key);
    setUserApiKey(key);
    setIsKeyInputOpen(false);
  };

  const getActiveKey = () => envApiKey || userApiKey;

  const getAIHelp = async () => {
    const activeKey = getActiveKey();
    if (!activeKey) {
      setIsKeyInputOpen(true);
      return;
    }
    
    if (!reqData) {
      setAdvice(lang === 'en' ? "Please upload your requirements.json first." : "প্রথমে requirements.json আপলোড করুন।");
      return;
    }

    setLoading(true);
    setAdvice('');
    
    try {
      const missingDocs = reqData.requirements.filter(req => {
        const match = matches.find(m => m.requirementId === req.id);
        return req.mandatory && !match;
      });

      const prompt = `The user is preparing a tender package for "${reqData.tender.title}" (ID: ${reqData.tender.tender_id}).
They are currently missing these mandatory documents:
${missingDocs.map(d => "- " + d.title_en).join("\n")}

Give a very brief, encouraging 2-3 sentence advice on what they need to do to complete the package.`;

      const aiResponse = await askAI(prompt, activeKey);
      setAdvice(aiResponse);
    } catch (err: any) {
      setAdvice(err.message || "Failed to get AI advice.");
      // If unauthorized, clear the user key
      if (err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("api key")) {
        localStorage.removeItem('groq_api_key');
        setUserApiKey('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
          setIsOpen(true);
          if (!advice && !loading && getActiveKey()) getAIHelp();
        }}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-transform hover:scale-110 z-50 flex items-center justify-center"
        title={lang === 'en' ? "Ask AI Assistant" : "AI অ্যাসিস্ট্যান্টকে জিজ্ঞাসা করুন"}
      >
        <Bot className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-bold">{lang === 'en' ? 'AI Assistant' : 'AI অ্যাসিস্ট্যান্ট'}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 min-h-[150px] max-h-[300px] overflow-y-auto">
            {isKeyInputOpen && !getActiveKey() ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Key className="w-4 h-4 text-indigo-500" />
                  {lang === 'en' ? 'Enter Groq API Key' : 'Groq API কী লিখুন'}
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {lang === 'en' 
                    ? 'To use the AI, please enter your Groq API key (gsk_...). It will be stored safely in your browser.' 
                    : 'AI ব্যবহার করতে, আপনার Groq API কী (gsk_...) লিখুন। এটি আপনার ব্রাউজারে নিরাপদে সংরক্ষিত থাকবে।'}
                </p>
                <input 
                  type="password"
                  placeholder="gsk_..."
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveKey(e.currentTarget.value);
                  }}
                  id="api-key-input"
                />
                <button 
                  onClick={() => saveKey((document.getElementById('api-key-input') as HTMLInputElement).value)}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {lang === 'en' ? 'Save & Start' : 'সংরক্ষণ করুন এবং শুরু করুন'}
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-6">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm font-medium">{lang === 'en' ? 'Thinking...' : 'চিন্তা করছে...'}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {advice}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center flex justify-between px-4">
             {getActiveKey() && (
               <button 
                 onClick={() => {
                   localStorage.removeItem('groq_api_key');
                   setUserApiKey('');
                   setIsKeyInputOpen(true);
                   setAdvice('');
                 }}
                 className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500"
               >
                 {lang === 'en' ? 'Clear Key' : 'কী মুছুন'}
               </button>
             )}
            <button 
              onClick={getAIHelp}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {lang === 'en' ? 'Refresh Advice' : 'উপদেশ রিফ্রেশ করুন'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
