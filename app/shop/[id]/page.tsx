'use client';
import { useState } from 'react';
import { use } from 'react'
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BoostBuddyShop({ params }: { params: Promise<{ id: string }>     } ) {
  // --- States ---
  const resolvedParams = use(params); 
  const storeId = resolvedParams.id;
  const [step, setStep] = useState<'rate' | 'review' | 'feedback' | 'success'>('rate');
  const [rating, setRating] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [complaint, setComplaint] = useState("");

  // --- Helpers ---
  const recordActivity = async (type: string, content: string, score?: number) => {
    try {
      await supabase.from('feedback_logs').insert([
        { type, content, rating: score, store_id: storeId }
      ]);
    } catch (err) {
      console.error("DB Error:", err);
    }
  };

  // --- Handlers ---
  const handleRate = (num: number) => {
    setRating(num);
    if (num >= 4) {
      setStep('review');
      recordActivity('review_start', `Customer gave ${num} stars`, num);
    } else {
      setStep('feedback');
      recordActivity('complaint_intercepted', `Low rating shield activated`, num);
    }
  };

  const generateAI = async (topic: string) => {
    setLoading(true);
    const res = await fetch('/api/generate-review', {
      method: 'POST',
      body: JSON.stringify({ storeName: "The Local Spot", likedItems: topic }),
    });
    const data = await res.json();
    setDraft(data.draft);
    setLoading(false);
    recordActivity('ai_generated', `Review drafted for: ${topic}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifying(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        body: JSON.stringify({ image: base64Data, mimeType: file.type }),
      });
      const data = await res.json();
      
      if (data.analysis.includes("VALID")) {
        setCoupon("BOOST10");
        recordActivity('receipt_verified', `Receipt verified via AI Vision`);
        setStep('success');
      } else {
        alert("Verification failed. Please use a receipt from today.");
      }
      setVerifying(false);
    };
    reader.readAsDataURL(file);
  };

  const submitComplaint = async () => {
    await recordActivity('complaint_detail', complaint, rating);
    setStep('success');
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center bg-white font-sans text-slate-900">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black text-orange-500">BoostBuddy</h1>
        <p className="text-slate-500 font-medium text-sm">Help us grow and get rewards!</p>
      </header>

      {/* STEP 1: RATING */}
      {step === 'rate' && (
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center shadow-xl shadow-orange-100/50">
          <p className="text-xl font-bold mb-6">How was your visit?</p>
          <div className="flex justify-between text-5xl">
            {[1, 2, 3, 4, 5].map((num) => (
              <button key={num} onClick={() => handleRate(num)} className="hover:scale-125 transition-transform duration-200">
                {num <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2A: HAPPY CUSTOMER */}
      {step === 'review' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 p-4 rounded-2xl text-center text-green-700 font-bold border border-green-200">
            You're the best! 🌟
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Coffee', 'Service', 'Vibe', 'Food'].map(item => (
              <button key={item} onClick={() => generateAI(item)} className="py-4 border-2 rounded-2xl hover:border-orange-500 hover:bg-orange-50 font-bold transition-all bg-white">
                {item}
              </button>
            ))}
          </div>

          {loading && <div className="text-center animate-pulse text-orange-500 font-bold">BoostBuddy is thinking...</div>}
          
          {draft && (
            <div className="p-6 bg-slate-50 rounded-3xl border-2 border-orange-200 shadow-inner">
              <p className="text-slate-700 leading-relaxed italic mb-4">"{draft}"</p>
              <button 
                onClick={() => {
                  const copyAndOpen = (text: string) => {
                        
                        const storeMap = {
                        "Starbucks": "ChIJa1_9_N5qkFQR_6pW_H6f90U",
                        "Dunkin": "ChIJ9UvY_YpYwokR3pS_y8_y0_U",
                        "McDonald's": "ChIJmQ9_tLpYwokR_6pW_H6f90U",
                        };

                        const currentPlaceId = storeMap[params.id as keyof typeof storeMap] || "DEFAULT_ID";
                        navigator.clipboard.writeText(text).then(() => {
                            alert("Review copied! Just paste it when Google opens.");
                            
                            // This is the most "aggressive" link to force the review box open
                            const googleUrl = `https://search.google.com/local/writereview?placeid=${currentPlaceId}`;
                            window.open(googleUrl, '_blank');
                        });
                        };
                }}
                className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Copy & Open Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2B: COMPLAINT FIREWALL */}
      {step === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-2xl text-red-700 font-bold border border-red-100">
            We're sorry! Tell us what happened.
          </div>
          <textarea 
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            className="w-full h-40 p-4 border-2 rounded-2xl focus:border-orange-500 outline-none text-slate-700" 
            placeholder="Your feedback goes directly to the manager..." 
          />
          <button onClick={submitComplaint} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">
            Send Private Feedback
          </button>
        </div>
      )}

      {/* STEP 3: SUCCESS & REWARDS */}
      {step === 'success' ? (
        <div className="text-center space-y-6 bg-orange-50 p-10 rounded-3xl border-2 border-orange-100">
          <div className="text-7xl">🎉</div>
          <h2 className="text-3xl font-black text-slate-800">You're All Set!</h2>
          {coupon && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">Your Discount Code</p>
              <div className="p-5 bg-white border-4 border-dashed border-orange-400 rounded-2xl font-mono text-3xl font-black text-orange-600">
                {coupon}
              </div>
            </div>
          )}
          <p className="text-slate-500">Thanks for helping us improve!</p>
        </div>
      ) : (
        /* REWARD TRIGGER (Visible until success) */
        <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white text-center shadow-2xl">
          <h2 className="text-xl font-black mb-1">Unlock 10% OFF</h2>
          <p className="text-slate-400 text-sm mb-6">Verify your visit with a receipt photo</p>
          <label className="block w-full bg-orange-500 text-white py-4 rounded-2xl font-bold cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
            {verifying ? "Checking Receipt..." : "📸 Take Photo"}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}
    </div>
  );
}